import http from 'http';
import { Player, PlayerAggregate } from "../models/player";
import { TableBase, TableManager } from "../models/table";
import { Controller } from "./utils";
import { Session } from '../modules/auth/session';
import { server } from '../main';
import { SessionManager } from '../modules/auth';
import { CardAggregate, CardBase } from '../models/card';


class TableController extends Controller {

    private timers = new Map()
    private timeout = 15

    async index(req: http.IncomingMessage, res: http.ServerResponse, session: Session, params: { [key: string]: string } = {id: ''}) {
        const tablesJson = await TableManager.readJsonFile()
        if(TableManager.tableNotExists(params.id, tablesJson) || !session.hasTableId() || !TableManager.isPlaying(session, tablesJson)) {
            return server.redirect(res, '/')
        }

        return super.httpResponse(res, 'table.html')
    }

    async show(req: http.IncomingMessage, res: http.ServerResponse, session: Session, params: {[key: string]: string} = {id: ''}) {
        const tablesJson = await TableManager.readJsonFile()
        if(TableManager.tableNotExists(params.id, tablesJson)) return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
        const tableJson = tablesJson[params.id]
        const table = TableBase.createTable(tableJson)
        return super.jsonResponse(res, table)
    }

    async next(req: http.IncomingMessage, res: http.ServerResponse, session: Session, params: { [key: string]: string } = {id: ''}) {
        const tablesJson = await TableManager.readJsonFile()
        if(TableManager.tableNotExists(params.id, tablesJson)) return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
        if(session.isNotMatchingTableId(params.id)) return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400); // 自分が所属しているテーブルかどうか
        const tableJson = tablesJson[params.id]
        const table = TableBase.createTable(tableJson)

        const cardJson = await super.getBody(req)
        const card = CardBase.createCard(JSON.parse(cardJson))
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
                super.WSResponse({table: ''}, wss)
                return super.jsonResponse(res, endGameTable)
            }

            return setTimeout(async() => {
                const tableJson = tablesJson[params.id]
                const table = TableBase.createTable(tableJson)
                const nextTable = table.next()
                await TableManager.writeJsonFile(nextTable)
                super.WSResponse({table: nextTable}, wss)
                return super.jsonResponse(res, nextTable)
            }, 5000)
        }
        const drawCardTable = discardedTable.drawCard()
        await TableManager.writeJsonFile(drawCardTable)
        super.WSResponse({table: drawCardTable}, wss)
        // const playerInTurn = drawCardTable.getPlayerInTurn()
        // this.timers.set(playerInTurn.id, setTimeout(() => {
        //     this.next(req, res, session, params)
        // }, this.timeout))
        return super.jsonResponse(res, drawCardTable);
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

}


export { TableController }