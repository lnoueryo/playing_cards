import http from 'http';
import { TableRule } from "./utils";
import { AuthToken, CookieManager, Session, SessionManagerFactory } from '../modules/auth';
import { config } from '../main';
import { Card, CardBase } from '../models/card';
import { TableManagerFactory } from '../models/table/table_manager/table_manager_factory';

class TableController extends TableRule {

    async index(req: http.IncomingMessage, res: http.ServerResponse, token: AuthToken, params: { [key: string]: string } = {id: ''}) {

        if(!token.hasTableId()) return config.server.redirect(res, '/');
        if(!token.isYourTable(params)) return config.server.redirect(res, `/table/${token.user.table_id}`);

        const table = await this.getTable(params.id)
        if(!table) {
            token.deleteSession()
            return config.server.redirect(res, '/')
        }

        if(table.isGameEndReached()) {
            const endGameTimer = this.endGameTimers.get(table.id)
            if(!endGameTimer) {
                const tm = TableManagerFactory.create(config.mongoTable)
                await tm.deleteTableJson(table)
                return config.server.redirect(res, '/')
            }
        }

        return this.httpResponse(res, 'table.html')
    }

    async show(req: http.IncomingMessage, res: http.ServerResponse, token: AuthToken, params: {[key: string]: string} = {id: ''}) {

        if(!token.hasTableId()) return config.server.redirect(res, '/');
        if(!token.isYourTable(params)) return config.server.redirect(res, `/table/${token.user.table_id}`);

        const table = await this.getTable(params.id)
        if(!table) {
            token.deleteSession()
            return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
        }
        const hidCardsTable = table.hideCards(token.user.user_id)
        const responseJson: any = {table: hidCardsTable}
        const playerInTurn = hidCardsTable.getPlayerInTurn()
        const time = this.timers.get(playerInTurn.id)
        if(time) responseJson[playerInTurn.id] = {time: {start: time.start, timeout: this.timeout}}

        return this.jsonResponse(res, responseJson)
    }

    async next(req: http.IncomingMessage, res: http.ServerResponse, token: AuthToken, params: { [key: string]: string } = {id: ''}) {

        if(!token.hasTableId()) return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
        if(!token.isYourTable(params)) return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);

        const table = await this.getTable(params.id)
        if(!table) {
            token.deleteSession()
            return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
        }
        if(token.user.user_id != table.getPlayerInTurn().id) return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);

        const cardJson = await this.getBody(req) as Card
        const card = CardBase.createCard(cardJson)
        const newTable = await this.discardAndDraw(table, card)
        return this.jsonResponse(res, newTable);
    }

    async exit(req: http.IncomingMessage, res: http.ServerResponse, token: AuthToken, params: {[key: string]: string} = {id: ''}) {

        if(!token.hasTableId()) return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
        if(!token.isYourTable(params)) return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);

        const table = await this.getTable(params.id)
        if(!table) {
            const referer = req.headers.referer;
            if(!referer || !referer.includes('/table/')) return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
            return config.server.redirect(res, '/')
        }

        // ゲームが既に始まっている場合
        if(table.isMaxPlayersReached() && !table.isGameEndReached()) return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);

        await table.deleteTable(config.DB, token.user.user_id)


        const tm = TableManagerFactory.create(config.mongoTable)
        let newTablesJson;
        if(table.otherPlayersNotExist()) {
            newTablesJson = await tm.deleteTableJson(table)
            const timer = this.endGameTimers.get(table.id)
            clearTimeout(timer)
        } else {
            const newTable = table.leaveTable(token.user.user_id)
            newTablesJson = await tm.updateTableJson(newTable)
            token.endGame()
        }

        const tables = tm.toTables(newTablesJson)
        const newTableJson = newTablesJson[params.id]

        const wssHome = config.server.getWSAllConnections()
        this.WSTablesResponse({tables: tables}, wssHome)

        const wssTable = config.server.getWSConnections(table.getPlayerIds())
        this.WSTableResponse({table: newTableJson}, wssTable)

        token.deleteSession()
        return config.server.redirect(res, '/')
    }

}


export { TableController }
