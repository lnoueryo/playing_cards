import http from 'http';
import { TableRule } from "./utils";
import { AuthToken } from '../modules/auth';
import { config } from '../main';
import { Card, CardBase } from '../models/card';
import { TableManagerFactory } from '../models/table/table_manager/table_manager_factory';

class TableController extends TableRule {

    async index(req: http.IncomingMessage, res: http.ServerResponse, token: AuthToken, params: { [key: string]: string } = {id: ''}) {

        const cfg = await config;
        try {

            if(!token.hasTableId()) {
                cfg.server.redirect(res, '/');
                return token
            }

            if(!token.isYourTable(params)) {
                cfg.server.redirect(res, `/table/${token.user.table_id}`);
                return token
            }
    
            const table = await this.getTable(params.id)
            if(!table) {
                token.deleteSession()
                cfg.server.redirect(res, '/')
                return token
            }
    
            if(table.isGameEndReached()) {
                const endGameTimer = this.endGameTimers.get(table.id)
                if(!endGameTimer) {
                    const tm = TableManagerFactory.create(cfg.mongoTable)
                    await tm.deleteTableJson(table)
                    cfg.server.redirect(res, '/')
                    return token
                }
            }
    
            this.httpResponse(res, 'table.html')
            
        } catch (error) {
            console.error(error)
            cfg.server.redirect(res, '/')
        }

        return token
    }

    async show(req: http.IncomingMessage, res: http.ServerResponse, token: AuthToken, params: {[key: string]: string} = {id: ''}) {

        const cfg = await config;

        if(!token.hasTableId() || !token.isYourTable(params)) {
            this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
            return token
        }

        const table = await this.getTable(params.id)
        if(!table) {
            token.deleteSession()
            this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
            return token
        }

        const hidCardsTable = table.hideCards(token.user.user_id)
        const responseJson: any = {table: hidCardsTable}
        const playerInTurn = hidCardsTable.getPlayerInTurn()
        const time = this.timers.get(playerInTurn.id)
        if(time) responseJson[playerInTurn.id] = {time: {start: time.start, timeout: this.timeout}}

        this.jsonResponse(res, responseJson)
        return token

    }

    async next(req: http.IncomingMessage, res: http.ServerResponse, token: AuthToken, params: { [key: string]: string } = {id: ''}) {

        if(!token.hasTableId() || !token.isYourTable(params)) {
            this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
            return token
        }

        const table = await this.getTable(params.id)
        if(!table) {
            token.deleteSession()
            this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
            return token
        }
        if(token.user.user_id != table.getPlayerInTurn().id) {
            this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
            return token
        }

        const cardJson = await this.getBody(req) as Card
        const card = CardBase.createCard(cardJson)
        const newTable = await this.discardAndDraw(table, card)
        this.jsonResponse(res, newTable);
        return token

    }

    async exit(req: http.IncomingMessage, res: http.ServerResponse, token: AuthToken, params: {[key: string]: string} = {id: ''}) {

        const cfg = await config;
        try {
            if(!token.hasTableId() || !token.isYourTable(params)) {
                cfg.server.redirect(res, `/table/${params.id}`);
                return token
            }
    
            const table = await this.getTable(params.id)
            if(!table) {
                const referer = req.headers.referer;
                if(!referer || !referer.includes('/table/')) {
                    cfg.server.redirect(res, `/table/${params.id}`);
                    return token
                }
                cfg.server.redirect(res, '/')
                return token
            }
    
            // ゲームが既に始まっている場合
            if(table.isMaxPlayersReached() && !table.isGameEndReached()) {
                cfg.server.redirect(res, `/table/${params.id}`);
                return token
            }
    
            await table.deleteTable(cfg.DB, token.user.user_id)
    
    
            const tm = TableManagerFactory.create(cfg.mongoTable)
            let newTablesJson;
            if(table.otherPlayersNotExist()) {
                newTablesJson = await tm.deleteTableJson(table)
                // キュー削除
                await cfg.rmqc.deleteQueue(table.id)
    
                const timer = this.endGameTimers.get(table.id)
                clearTimeout(timer)
            } else {
                const newTable = table.leaveTable(token.user.user_id)
                newTablesJson = await tm.updateTableJson(newTable)
                token.endGame()
            }
    
            const tables = tm.toTables(newTablesJson)
            const newTableJson = newTablesJson[params.id]
    
            const wssHome = cfg.server.getWSAllConnections()
            this.WSTablesResponse({tables: tables}, wssHome)
    
            const wssTable = cfg.server.getWSConnections(table.getPlayerIds())
            this.WSTableResponse({table: newTableJson}, wssTable)
    
            token.deleteSession()
            cfg.server.redirect(res, '/')
            
        } catch (error) {
            console.error(error)
            cfg.server.redirect(res, `/table/${params.id}`);
        }

        return token
    }

}


export { TableController }
