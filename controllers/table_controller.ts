import http from 'http';
import { Table, TableManager } from "../models/table";
import { Controller } from "./utils";
import { Session } from '../modules/auth';
import { config } from '../main';
import { Card, CardAggregate, CardBase } from '../models/card';
import { Player, PlayerAggregate } from '../models/player';
import { TableJson } from '../models/table/table';
import * as WebSocket from 'ws';
import { TableManagerFactory } from '../models/table/table_manager/table_manager_factory';


class TableController extends Controller {

    private timers = new Map()
    private timeout = 6000
    private endGameTimers = new Map()
    private endGameTimeout = 20000

    async index(req: http.IncomingMessage, res: http.ServerResponse, session: Session, params: { [key: string]: string } = {id: ''}) {
        const tm = TableManagerFactory.create()
        const tablesJson = await tm.getTablesJson()
        if(tm.tableNotExists(params.id, tablesJson) || !session.hasTableId() || !tm.isPlaying(session, tablesJson)) {
            return config.server.redirect(res, '/')
        }
        const tableJson = tablesJson[params.id]
        const table = Table.createTable(tableJson)
        if(table.isGameEndReached()) {
            const endGameTimer = this.endGameTimers.get(table.id)
            if(!endGameTimer) {
                await tm.deleteTableJson(table)
                return config.server.redirect(res, '/')
            }
        }
        return super.httpResponse(res, 'table.html')
    }

    async create(req: http.IncomingMessage, res: http.ServerResponse, session: Session) {

        const {maxPlayers, maxRounds, maxGames} = await super.getBody(req) as Table
        const tm = TableManagerFactory.create()
        const tablesJson = await tm.getTablesJson()
        if(session.hasTableId() && !tm.tableNotExists(session.tableId, tablesJson) && tm.isPlaying(session, tablesJson)) {
            return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400)
        }
        const tables = tm.toTables(tablesJson)
        const player = new Player(session.user.id, session.userName)
        const playerAggregate = new PlayerAggregate()
        const newPlayerAggregate = playerAggregate.addPlayer(player)
        const cardAggregate = CardAggregate.createNewCards();
        const table = new Table(cardAggregate, newPlayerAggregate, maxPlayers, maxRounds, maxGames);
        tables.push(table)
        console.log(table)
        // テーブル追加&&テーブルidセッションに追加
        await tm.createTableJson(table)
        const newSession = session.joinTable(table.id)
        newSession.updateUser()

        const wss = config.server.getWSAllConnections()
        super.WSResponse({tables: tables}, wss)
        return super.jsonResponse(res, table)
    }

    async joinPlayer(req: http.IncomingMessage, res: http.ServerResponse, session: Session, params: {[key: string]: string} = {id: ''}) {
        const tm = TableManagerFactory.create()
        const tablesJson = await tm.getTablesJson()
        if(session.hasTableId() && tm.tableNotExists(params.id, tablesJson)) return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
        const player = new Player(session.userId, session.userName)
        const tableJson = tablesJson[params.id]
        const table = Table.createTable(tableJson)
        console.log(table.isMaxPlayersReached())
        console.log(table.isGameEndReached())
        if(table.isMaxPlayersReached() || table.isGameEndReached()) return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400);

        let addedPlayerTable = table.addPlayer(player)
        const wssTable = config.server.getWSConnections(table.getPlayerIds())
        if(addedPlayerTable.isMaxPlayersReached()) {
            addedPlayerTable = addedPlayerTable.start()
            this.setTimer(addedPlayerTable, wssTable)
        }
        super.WSResponse({table: addedPlayerTable}, wssTable)

        const newTablesJson = await tm.updateTableJson(addedPlayerTable)
        const tables = tm.toTables(newTablesJson)
        const newSession = session.joinTable(addedPlayerTable.id)
        newSession.updateUser()

        const wssHome = config.server.getWSAllConnections()
        super.WSResponse({tables: tables}, wssHome)

        return super.jsonResponse(res, addedPlayerTable)

    }

    async show(req: http.IncomingMessage, res: http.ServerResponse, session: Session, params: {[key: string]: string} = {id: ''}) {

        const tm = TableManagerFactory.create()
        const tablesJson = await tm.getTablesJson()
        if(tm.tableNotExists(params.id, tablesJson)) return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
        const tableJson = tablesJson[params.id]
        const table = Table.createTable(tableJson)
        const responseJson: any = {table}

        const playerInTurn = table.getPlayerInTurn()
        const time = this.timers.get(playerInTurn.id)
        if(time) {
            responseJson[playerInTurn.id] = {time: {start: time.start, timeout: this.timeout}}
        }

        return super.jsonResponse(res, responseJson)
    }

    async next(req: http.IncomingMessage, res: http.ServerResponse, session: Session, params: { [key: string]: string } = {id: ''}) {

        const tm = TableManagerFactory.create()
        const tablesJson = await tm.getTablesJson()
        if(tm.tableNotExists(params.id, tablesJson)) return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
        if(session.isNotMatchingTableId(params.id)) return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400); // 自分が所属しているテーブルかどうか

        const tableJson = tablesJson[params.id]
        const table = Table.createTable(tableJson)
        if(session.userId != table.getPlayerInTurn().id) return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400);

        const cardJson = await super.getBody(req) as Card
        const card = CardBase.createCard(cardJson)
        const newTable = await this.discardAndDraw(table, card)

        return super.jsonResponse(res, newTable);
    }

    async exit(req: http.IncomingMessage, res: http.ServerResponse, session: Session, params: {[key: string]: string} = {id: ''}) {

        const tm = TableManagerFactory.create()
        const tablesJson = await tm.getTablesJson()
        if(tm.tableNotExists(params.id, tablesJson)) return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
        if(session.isNotMatchingTableId(params.id)) return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400); // 自分が所属しているテーブルかどうか
        const tableJson = tablesJson[params.id]
        const table = Table.createTable(tableJson)
        // ゲームが既に始まっている場合
        if(table.isMaxPlayersReached() && !table.isGameEndReached()) return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
        if(table.otherPlayersNotExist()) {
            await tm.deleteTableJson(table)
        } else {
            const newTable = table.leaveTable(session.userId)
            await tm.updateTableJson(newTable)
        }
        const newTablesJson = await tm.getTablesJson()
        const tables = tm.toTables(newTablesJson)
        const newTableJson = newTablesJson[params.id]

        const wssHome = config.server.getWSAllConnections()
        super.WSResponse({tables: tables}, wssHome)

        const wssTable = config.server.getWSConnections(table.getPlayerIds())
        super.WSResponse({table: newTableJson}, wssTable)

        return super.jsonResponse(res, newTableJson)
    }

    async reset(req: http.IncomingMessage, res: http.ServerResponse, session: Session, params?: { [key: string]: string }) {

        const tm = TableManagerFactory.create()
        const tablesJson = await tm.getTablesJson()
        if(!params?.id || params.id in tablesJson == false) return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400)
        if(session.isNotMatchingTableId(params.id)) return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400)
        const tableJson = tablesJson[params.id]
        const table = Table.createTable(tableJson)
        const nextGameStartTable = table.prepareNextGame().handOverCards().drawCard()
        await tm.updateTableJson(nextGameStartTable)

        const _wss = config.server.getWSConnections(table.playerAggregate.players.map((player) => player.id))
        super.WSResponse({table: nextGameStartTable}, _wss)
        return super.jsonResponse(res, nextGameStartTable)
    }

    protected async discardAndDraw(table: Table, card: CardBase) {

        const playerInTurnId = table.getPlayerInTurn().id
        const time = this.timers.get(playerInTurnId);
        if(time) {
            clearTimeout(time.timer)
            this.timers.delete(playerInTurnId)
        }
        const discardedTable = table.discard(card)

        const wss = config.server.getWSConnections(discardedTable.getPlayerIds())
        // 次のゲーム
        if(discardedTable.isGameEndRoundReached()) {
            const endGameTable = discardedTable.endGame()
            const tm = TableManagerFactory.create()
            const tablesJson = await tm.updateTableJson(endGameTable)
            endGameTable.playerAggregate.players.forEach(player => {
                console.log(player.hand)
            })
            this.WSResponse({table: endGameTable}, wss)

            // ゲーム終了
            if(endGameTable.isGameEndReached()) {
                const endGameTimer = setTimeout(async() => {
                    const tablesJson = await tm.deleteTableJson(endGameTable)
                    const tables = tm.toTables(tablesJson)
                    this.WSResponse({table: ''}, wss)
                    this.endGameTimers.delete(endGameTable.id)
                    const wssHome = config.server.getWSAllConnections()
                    super.WSResponse({tables: tables}, wssHome)
                }, this.endGameTimeout)
                this.endGameTimers.set(endGameTable.id, endGameTimer)
                return endGameTable
            }
            // TODO　まだ試していない
            setTimeout(async() => {
                const tableJson = tablesJson[endGameTable.id]
                const table = Table.createTable(tableJson)
                const preparedTable = table.prepareNextGame()

                const nextGameStartTable = preparedTable.handOverCards().drawCard()
                const tm = TableManagerFactory.create()
                await tm.updateTableJson(nextGameStartTable)
                this.WSResponse({table: nextGameStartTable}, wss)
            }, this.timeout)
            return endGameTable
        }

        // 次のターン
        const drawCardTable = discardedTable.drawCard()
        const tm = TableManagerFactory.create()
        await tm.updateTableJson(drawCardTable)
        this.setTimer(drawCardTable, wss)
        return drawCardTable;
    }

    protected setTimer(table: Table, wss: (WebSocket.WebSocket | undefined)[]) {

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