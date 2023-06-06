import http from 'http';
import { TableRule } from "./utils";
import { AuthToken } from '../modules/auth';
import { config } from '../main';
import { TableManagerFactory } from '../models/table/table_manager/table_manager_factory';
import { Table } from '../models/table';
import { Player, PlayerAggregate } from '../models/player';
import { CardAggregate } from '../models/card';
import { AuthTokenManagerFactory } from '../modules/auth/auth_token_factory';
import url from 'url'

class HomeController extends TableRule {

    async index(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken) {
        const tm = TableManagerFactory.create()
        const tablesJson = await tm.getTablesJson()
        if(session.table_id) {
            if(tm.tableNotExists(session.table_id, tablesJson)) {
                session = await session.updateTableId(session.table_id)
            } else {
                config.server.redirect(res, `/table/${session.table_id}`)
            }
        }
        const requestUrl = url.parse(req.url || '', true);
        const pathname = requestUrl.pathname || '/';
        if(session.hasTableId() && tm.isPlaying(session, tablesJson)) return config.server.redirect(res, `/table/${session.table_id}`)
        return this.httpResponse(res, 'index.html')
    }

    async tables(req: http.IncomingMessage, res: http.ServerResponse) {
        const tm = TableManagerFactory.create()
        const tableJson = await tm.getTablesJson()
        const tables = tm.toTables(tableJson)
        return this.jsonResponse(res, tables)
    }

    async create(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken) {

        const {maxPlayers, maxRounds, maxGames} = await this.getBody(req) as Table
        const tm = TableManagerFactory.create()
        const tablesJson = await tm.getTablesJson()
        if(session.hasTableId() && !tm.tableNotExists(session.table_id, tablesJson) && tm.isPlaying(session, tablesJson)) {
            return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400)
        }
        const tables = tm.toTables(tablesJson)
        const player = new Player(session.user_id, session.user_name)
        const playerAggregate = new PlayerAggregate()
        const newPlayerAggregate = playerAggregate.addPlayer(player)
        const cardAggregate = CardAggregate.createNewCards();
        const table = new Table(cardAggregate, newPlayerAggregate, maxPlayers, maxRounds, maxGames);
        tables.push(table)
        // テーブル追加&&テーブルidセッションに追加
        const authToken = await AuthTokenManagerFactory.create(session.user, session.id, req, res)
        await authToken.updateTableId(table.id)
        await tm.createTableJson(table)
        console.log('check header', res.getHeader('Set-Cookie'))
        const wss = config.server.getWSAllConnections()
        this.WSResponse({tables: tables}, wss)
        return this.jsonResponse(res, table)
    }

    async joinPlayer(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken) {

        const { table_id } = await this.getBody(req) as {table_id: string}
        const tm = TableManagerFactory.create()
        const tablesJson = await tm.getTablesJson()
        if(session.hasTableId() && tm.tableNotExists(table_id, tablesJson)) return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
        const player = new Player(session.user_id, session.user_name)
        const tableJson = tablesJson[table_id]
        const table = Table.createTable(tableJson)
        if(table.isMaxPlayersReached() || table.isGameEndReached()) return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);

        let addedPlayerTable = table.addPlayer(player)
        const wssTable = config.server.getWSConnections(table.getPlayerIds())
        if(addedPlayerTable.isMaxPlayersReached()) {
            addedPlayerTable = addedPlayerTable.start()
            this.setTimer(addedPlayerTable, wssTable)
        }
        this.WSResponse({table: addedPlayerTable}, wssTable)

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