import http from 'http';
import { Table } from "../models/table";
import { TableRule } from "./utils";
import { AuthToken } from '../modules/auth';
import { config } from '../main';
import { Card, CardBase } from '../models/card';
import { TableManagerFactory } from '../models/table/table_manager/table_manager_factory';

class TableController extends TableRule {

    async index(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken, params: { [key: string]: string } = {id: ''}) {

        if(!session.hasTableId()) return config.server.redirect(res, '/');
        if(!session.isYourTable(params)) return config.server.redirect(res, `/table/${session.table_id}`);

        const table = await this.getTable(params.id)
        if(!table) {
            session.deleteSession()
            return config.server.redirect(res, '/')
        }

        if(table.isGameEndReached()) {
            const endGameTimer = this.endGameTimers.get(table.id)
            if(!endGameTimer) {
                const tm = TableManagerFactory.create()
                await tm.deleteTableJson(table)
                return config.server.redirect(res, '/')
            }
        }

        return this.httpResponse(res, 'table.html')
    }

    async show(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken, params: {[key: string]: string} = {id: ''}) {

        if(!session.hasTableId()) return config.server.redirect(res, '/');
        if(!session.isYourTable(params)) return config.server.redirect(res, `/table/${session.table_id}`);

        const table = await this.getTable(params.id)
        if(!table) {
            session.deleteSession()
            return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
        }

        const responseJson: any = {table}
        const playerInTurn = table.getPlayerInTurn()
        const time = this.timers.get(playerInTurn.id)
        if(time) responseJson[playerInTurn.id] = {time: {start: time.start, timeout: this.timeout}}

        return this.jsonResponse(res, responseJson)
    }

    async next(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken, params: { [key: string]: string } = {id: ''}) {

        if(!session.hasTableId()) return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
        if(!session.isYourTable(params)) return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);

        const table = await this.getTable(params.id)
        if(!table) {
            session.deleteSession()
            return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
        }
        if(session.user_id != table.getPlayerInTurn().id) return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);

        const cardJson = await this.getBody(req) as Card
        const card = CardBase.createCard(cardJson)
        const newTable = await this.discardAndDraw(table, card)

        return this.jsonResponse(res, newTable);
    }

    async exit(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken, params: {[key: string]: string} = {id: ''}) {

        if(!session.hasTableId()) return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
        if(!session.isYourTable(params)) return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);

        const table = await this.getTable(params.id)
        if(!table) {
            const referer = req.headers.referer;
            if(!referer || !referer.includes('/table/')) return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
            return config.server.redirect(res, '/')
        }

        // ゲームが既に始まっている場合
        if(table.isMaxPlayersReached() && !table.isGameEndReached()) return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
        const tm = TableManagerFactory.create()
        let newTablesJson;
        if(table.otherPlayersNotExist()) {
            newTablesJson = await tm.deleteTableJson(table)
        } else {
            const newTable = table.leaveTable(session.user_id)
            newTablesJson = await tm.updateTableJson(newTable)
        }

        const tables = tm.toTables(newTablesJson)
        const newTableJson = newTablesJson[params.id]

        const wssHome = config.server.getWSAllConnections()
        this.WSResponse({tables: tables}, wssHome)

        const wssTable = config.server.getWSConnections(table.getPlayerIds())
        this.WSResponse({table: newTableJson}, wssTable)

        return config.server.redirect(res, '/')
    }

}


export { TableController }