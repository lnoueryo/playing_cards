import http from 'http';
import { TableBase, TableManager } from "../models/table";
import { Controller } from "./utils";
import { Session } from '../modules/auth/session';
import { server } from '../main';
import { Card, CardAggregate, CardBase } from '../models/card';
import { Player, PlayerAggregate } from '../models/player';
import { Table } from '../models/table/table';
import { SessionManager } from '../modules/auth';
import * as WebSocket from 'ws';


class TableController extends Controller {

    private timers = new Map()
    private timeout = 8000

    async index(req: http.IncomingMessage, res: http.ServerResponse, session: Session, params: { [key: string]: string } = {id: ''}) {
        const tablesJson = await TableManager.readJsonFile()
        if(TableManager.tableNotExists(params.id, tablesJson) || !session.hasTableId() || !TableManager.isPlaying(session, tablesJson)) {
            return server.redirect(res, '/')
        }

        return super.httpResponse(res, 'table.html')
    }

    async create(req: http.IncomingMessage, res: http.ServerResponse, session: Session) {
        const {maxPlayers, maxRounds, maxGames} = await super.getBody(req) as Table
        const tablesJson = await TableManager.readJsonFile()
        if(session.hasTableId() && !TableManager.tableNotExists(session.tableId, tablesJson) && TableManager.isPlaying(session, tablesJson)) {
            return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400)
        }
        const tables = TableManager.toTables(tablesJson)
        const player = new Player(session.id, session.name)
        const playerAggregate = new PlayerAggregate()
        const newPlayerAggregate = playerAggregate.addPlayer(player)
        const cardAggregate = CardAggregate.createNewCards();
        const table = new TableBase(cardAggregate, newPlayerAggregate, maxPlayers, maxRounds, maxGames);
        tables.push(table)

        // テーブル追加&&テーブルidセッションに追加
        await TableManager.writeJsonFile(table)
        const newSession = session.joinTable(table.id)
        SessionManager.writeSessions(newSession)

        const wss = server.getWSAllConnections()
        super.WSResponse({tables: tables}, wss)
        return super.jsonResponse(res, table)
    }

    async joinPlayer(req: http.IncomingMessage, res: http.ServerResponse, session: Session, params: {[key: string]: string} = {id: ''}) {
        const tablesJson = await TableManager.readJsonFile()
        if(session.hasTableId() && await TableManager.isPlaying(session, tablesJson)) return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
        if(TableManager.tableNotExists(params.id, tablesJson)) return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400);

        const player = new Player(session.data.id, session.data.name)
        const tableJson = tablesJson[params.id]
        const table = TableBase.createTable(tableJson)
        if(table.isMaxPlayersReached()) return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400);

        let addedPlayerTable = table.addPlayer(player)
        const wssTable = server.getWSConnections(table.getPlayerIds())
        if(addedPlayerTable.isMaxPlayersReached()) {
            addedPlayerTable = addedPlayerTable.start()
            this.setTimer(addedPlayerTable, wssTable)
        }
        super.WSResponse({table: addedPlayerTable}, wssTable)

        const newTablesJson = await TableManager.writeJsonFile(addedPlayerTable)
        const tables = TableManager.toTables(newTablesJson)
        const newSession = session.joinTable(addedPlayerTable.id)
        SessionManager.writeSessions(newSession)

        const wssHome = server.getWSAllConnections()
        super.WSResponse({tables: tables}, wssHome)

        return super.jsonResponse(res, addedPlayerTable)

    }

    async show(req: http.IncomingMessage, res: http.ServerResponse, session: Session, params: {[key: string]: string} = {id: ''}) {
        const tablesJson = await TableManager.readJsonFile()
        if(TableManager.tableNotExists(params.id, tablesJson)) return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
        const tableJson = tablesJson[params.id]
        const table = TableBase.createTable(tableJson)
        const responseJson: any = {table}

        const playerInTurn = table.getPlayerInTurn()
        const time = this.timers.get(playerInTurn.id)
        if(time) {
            responseJson[playerInTurn.id] = {time: {start: time.start, timeout: this.timeout}}
        }

        return super.jsonResponse(res, responseJson)
    }

    async next(req: http.IncomingMessage, res: http.ServerResponse, session: Session, params: { [key: string]: string } = {id: ''}) {

        const tablesJson = await TableManager.readJsonFile()
        if(TableManager.tableNotExists(params.id, tablesJson)) return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
        if(session.isNotMatchingTableId(params.id)) return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400); // 自分が所属しているテーブルかどうか

        const tableJson = tablesJson[params.id]
        const table = TableBase.createTable(tableJson)
        if(session.id != table.getPlayerInTurn().id) return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400);

        const cardJson = await super.getBody(req) as Card
        const card = CardBase.createCard(cardJson)
        const newTable = await this.discardAndDraw(table, card)

        return super.jsonResponse(res, newTable);
    }

    async exit(req: http.IncomingMessage, res: http.ServerResponse, session: Session, params: {[key: string]: string} = {id: ''}) {
        const tablesJson = await TableManager.readJsonFile()
        if(TableManager.tableNotExists(params.id, tablesJson)) return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
        if(session.isNotMatchingTableId(params.id)) return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400); // 自分が所属しているテーブルかどうか
        const tableJson = tablesJson[params.id]
        const table = TableBase.createTable(tableJson)
        if(table.otherPlayersNotExist()) {
            await TableManager.deleteJsonFile(table)
        } else {
            const newTable = table.leaveTable(session.id)
            await TableManager.writeJsonFile(newTable)
        }
        const newTablesJson = await TableManager.readJsonFile()
        const tables = TableManager.toTables(newTablesJson)
        const newTableJson = newTablesJson[params.id]

        const wssHome = server.getWSAllConnections()
        super.WSResponse({tables: tables}, wssHome)

        const wssTable = server.getWSConnections(table.getPlayerIds())
        super.WSResponse({table: newTableJson}, wssTable)

        return super.jsonResponse(res, newTableJson)
    }

    async reset(req: http.IncomingMessage, res: http.ServerResponse, session: Session, params?: { [key: string]: string }) {

        const tablesJson = await TableManager.readJsonFile()
        if(!params?.id || params.id in tablesJson == false) return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400)
        if(session.isNotMatchingTableId(params.id)) return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400)
        const tableJson = tablesJson[params.id]
        const table = TableBase.createTable(tableJson)
        const nextTable = table.next()
        await TableManager.writeJsonFile(nextTable)

        const _wss = server.getWSConnections(table.playerAggregate.players.map((player) => player.id))
        super.WSResponse({table: nextTable}, _wss)
        return super.jsonResponse(res, nextTable)
    }

    protected async discardAndDraw(table: TableBase, card: CardBase) {
        const time = this.timers.get(table.getPlayerInTurn().id)
        if(time) clearTimeout(time.timer)
        const discardedTable = table.discard(card)

        const wss = server.getWSConnections(discardedTable.getPlayerIds())
        if(discardedTable.isGameEndRoundReached()) {
            const endGameTable = discardedTable.determineWinner().endGame()
            const tablesJson = await TableManager.writeJsonFile(endGameTable)
            endGameTable.playerAggregate.players.forEach(player => {
                console.log(player.hand)
            })
            if(endGameTable.isGameEndReached()) {
                await TableManager.deleteJsonFile(endGameTable)
                this.WSResponse({table: ''}, wss)
                return endGameTable
            }

            setTimeout(async() => {
                const tableJson = tablesJson[endGameTable.id]
                const table = TableBase.createTable(tableJson)
                const nextTable = table.next()
                await TableManager.writeJsonFile(nextTable)
                this.WSResponse({table: nextTable}, wss)
            }, 5000)
            return endGameTable
        }
        const drawCardTable = discardedTable.drawCard()
        await TableManager.writeJsonFile(drawCardTable)
        this.setTimer(drawCardTable, wss)
        return drawCardTable;
    }

    protected setTimer(table: TableBase, wss: (WebSocket.WebSocket | undefined)[]) {
        const playerInTurn = table.getPlayerInTurn()
        const start = Date.now(); // タイマー開始時刻を記録
        const timer = setTimeout(() => {
            const drawnCard = playerInTurn.getDrawnCard()
            this.discardAndDraw(table, drawnCard)
        }, this.timeout)

        this.timers.set(playerInTurn.id, {timer, start})
        this.WSResponse({table: table, [playerInTurn.id]: {time: {start, timeout: this.timeout}}}, wss)
    }

}


export { TableController }