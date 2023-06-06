import http from 'http';
import { Table } from "../models/table";
import { TableRule } from "./utils";
import { AuthToken } from '../modules/auth';
import { config } from '../main';
import { Card, CardBase } from '../models/card';
import { TableManagerFactory } from '../models/table/table_manager/table_manager_factory';

class TableController extends TableRule {

    async index(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken, params: { [key: string]: string } = {id: ''}) {
        const tm = TableManagerFactory.create()
        const tablesJson = await tm.getTablesJson()
        if(tm.tableNotExists(params.id, tablesJson) || !session.hasTableId() || !tm.isPlaying(session, tablesJson)) {
            session.deleteSession()
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
        return this.httpResponse(res, 'table.html')
    }

    async show(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken, params: {[key: string]: string} = {id: ''}) {

        const tm = TableManagerFactory.create()
        const tablesJson = await tm.getTablesJson()
        if(tm.tableNotExists(params.id, tablesJson)) return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
        const tableJson = tablesJson[params.id]
        const table = Table.createTable(tableJson)
        const responseJson: any = {table}

        const playerInTurn = table.getPlayerInTurn()
        const time = this.timers.get(playerInTurn.id)
        if(time) {
            responseJson[playerInTurn.id] = {time: {start: time.start, timeout: this.timeout}}
        }

        return this.jsonResponse(res, responseJson)
    }

    async next(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken, params: { [key: string]: string } = {id: ''}) {

        const tm = TableManagerFactory.create()
        const tablesJson = await tm.getTablesJson()
        if(tm.tableNotExists(params.id, tablesJson)) return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
        if(session.isNotMatchingTableId(params.id)) return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400); // 自分が所属しているテーブルかどうか

        const tableJson = tablesJson[params.id]
        const table = Table.createTable(tableJson)
        if(session.user_id != table.getPlayerInTurn().id) return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);

        const cardJson = await this.getBody(req) as Card
        const card = CardBase.createCard(cardJson)
        const newTable = await this.discardAndDraw(table, card)

        return this.jsonResponse(res, newTable);
    }

    async exit(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken, params: {[key: string]: string} = {id: ''}) {

        const tm = TableManagerFactory.create()
        const tablesJson = await tm.getTablesJson()
        if(tm.tableNotExists(params.id, tablesJson)) {
            const referer = req.headers.referer;
            if(!referer || !referer.includes('/table/')) return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
            return config.server.redirect(res, '/')
        }
        if(session.isNotMatchingTableId(params.id)) return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400); // 自分が所属しているテーブルかどうか
        const tableJson = tablesJson[params.id]
        const table = Table.createTable(tableJson)
        // ゲームが既に始まっている場合
        if(table.isMaxPlayersReached() && !table.isGameEndReached()) return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
        if(table.otherPlayersNotExist()) {
            await tm.deleteTableJson(table)
        } else {
            const newTable = table.leaveTable(session.user_id)
            await tm.updateTableJson(newTable)
        }
        const newTablesJson = await tm.getTablesJson()
        const tables = tm.toTables(newTablesJson)
        const newTableJson = newTablesJson[params.id]

        const wssHome = config.server.getWSAllConnections()
        this.WSResponse({tables: tables}, wssHome)

        const wssTable = config.server.getWSConnections(table.getPlayerIds())
        this.WSResponse({table: newTableJson}, wssTable)

        return config.server.redirect(res, '/')
    }

    async reset(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken, params?: { [key: string]: string }) {

        const tm = TableManagerFactory.create()
        const tablesJson = await tm.getTablesJson()
        if(!params?.id || params.id in tablesJson == false) return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400)
        if(session.isNotMatchingTableId(params.id)) return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400)
        const tableJson = tablesJson[params.id]
        const table = Table.createTable(tableJson)
        const nextGameStartTable = table.prepareNextGame().handOverCards().drawCard()
        await tm.updateTableJson(nextGameStartTable)

        const _wss = config.server.getWSConnections(table.playerAggregate.players.map((player) => player.id))
        this.WSResponse({table: nextGameStartTable}, _wss)
        return this.jsonResponse(res, nextGameStartTable)
    }

}


export { TableController }