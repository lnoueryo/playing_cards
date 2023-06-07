import http from 'http';
import { TableRule } from "./utils";
import { AuthToken } from '../modules/auth';
import { config } from '../main';
import { TableManagerFactory } from '../models/table/table_manager/table_manager_factory';
import { Table } from '../models/table';
import { Player, PlayerAggregate } from '../models/player';
import { CardAggregate } from '../models/card';
import { AuthTokenManagerFactory } from '../modules/auth/auth_token';
import url from 'url'

class HomeController extends TableRule {

    async index(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken) {

        const tm = TableManagerFactory.create()
        const tablesJson = await tm.getTablesJson()
        if(session.hasTableId()) {
            if(tm.tableNotExists(session.table_id, tablesJson)) {
                // table_id削除
                session = await session.updateTableId(session.table_id)
            } else {
                return config.server.redirect(res, `/table/${session.table_id}`)
            }
        }

        return this.httpResponse(res, 'index.html')
    }

    async tables(req: http.IncomingMessage, res: http.ServerResponse) {

        const tables = await this.getTables()
        return this.jsonResponse(res, tables)
    }

    async create(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken) {

        const {maxPlayers, maxRounds, maxGames} = await this.getBody(req) as Table
        const tm = TableManagerFactory.create()
        const tables = await this.getTables()

        const player = new Player(session.user_id, session.user_name)
        const playerAggregate = new PlayerAggregate()
        const newPlayerAggregate = playerAggregate.addPlayer(player)
        const cardAggregate = CardAggregate.createNewCards();
        const table = new Table(cardAggregate, newPlayerAggregate, maxPlayers, maxRounds, maxGames);
        tables.push(table)

        // テーブル追加&&テーブルidセッションに追加
        const authToken = await AuthTokenManagerFactory.create(session.user, session.id, req, res)
        await authToken.updateTableId(table.id)
        if(!res.getHeader('Set-Cookie')) throw new Error("token isn't set")

        await tm.createTableJson(table)
        const wss = config.server.getWSAllConnections()
        this.WSResponse({tables: tables}, wss)
        return this.jsonResponse(res, table)

    }

    async joinPlayer(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken) {

        if(session.hasTableId()) return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);

        const { table_id } = await this.getBody(req) as {table_id: string}
        const table = await this.getTable(table_id)
        if(!table) return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
        if(table.isMaxPlayersReached() || table.isGameEndReached()) return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);

        const player = new Player(session.user_id, session.user_name)
        let addedPlayerTable = table.addPlayer(player)

        const wssTable = config.server.getWSConnections(table.getPlayerIds())
        if(addedPlayerTable.isMaxPlayersReached()) {
            addedPlayerTable = addedPlayerTable.start()
            this.setTimer(addedPlayerTable, wssTable)
        }
        this.WSResponse({table: addedPlayerTable}, wssTable)

        const tm = TableManagerFactory.create()
        const newTablesJson = await tm.updateTableJson(addedPlayerTable)
        const tables = tm.toTables(newTablesJson)
        const authToken = await AuthTokenManagerFactory.create(session.user, session.id, req, res)
        await authToken.updateTableId(addedPlayerTable.id)

        const wssHome = config.server.getWSAllConnections()
        this.WSResponse({tables: tables}, wssHome)

        return this.jsonResponse(res, addedPlayerTable)

    }

}

export { HomeController }