import http from 'http';
import { TableRule } from "./utils";
import { AuthToken, SessionManagerFactory } from '../modules/auth';
import { config } from '../main';
import { TableManagerFactory } from '../models/table/table_manager/table_manager_factory';
import { Table } from '../models/table';
import { Player, PlayerAggregate } from '../models/player';
import { CardAggregate } from '../models/card';
import { AuthTokenManagerFactory } from '../modules/auth/auth_token';


class HomeController extends TableRule {

    async index(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken) {

        const tm = TableManagerFactory.create(config.mongoTable)
        const tablesJson = await tm.getTablesJson()

        if(session.hasTableId()) {
            if(!tm.tableNotExists(session.user.table_id, tablesJson)) {
                const table = Table.createTable(tablesJson[session.user.table_id])
                if(table.isAfterGameEnd()) {
                    // 通信障害などにより、トークンをセットできなかった可能性あり
                    const authToken = await AuthTokenManagerFactory.create(session.user, session.id, req, res, config.tableToken, SessionManagerFactory.create(config.sessionManagement, config.DB), config.secretKey)
                    await authToken.createTable(session.user.table_id)
                    return config.server.redirect(res, `/table/${session.user.table_id}`)
                }
            }

            // table_id削除
            session = await session.deleteTable(session.user.table_id)
        }

        return this.httpResponse(res, 'index.html')
    }

    async tables(req: http.IncomingMessage, res: http.ServerResponse) {

        const tables = await this.getTables()
        return this.jsonResponse(res, tables)
    }

    async create(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken) {

        const {maxPlayers, maxRounds, maxGames} = await this.getBody(req) as Table
        const tm = TableManagerFactory.create(config.mongoTable)
        const tables = await this.getTables()

        const player = new Player(session.user.user_id, session.user.name)
        const playerAggregate = new PlayerAggregate()
        const newPlayerAggregate = playerAggregate.addPlayer(player)
        const cardAggregate = CardAggregate.createNewCards();
        const table = new Table(cardAggregate, newPlayerAggregate, maxPlayers, maxRounds, maxGames);
        tables.push(table)

        await table.createTable(config.DB, session)
        //　キュー挿入

        // テーブル追加&&テーブルidセッションに追加
        const authToken = await AuthTokenManagerFactory.create(session.user, session.id, req, res, config.tableToken, SessionManagerFactory.create(config.sessionManagement, config.DB), config.secretKey)
        await authToken.createTable(table.id)
        if(!res.getHeader('Set-Cookie')) throw new Error("token isn't set")

        await tm.createTableJson(table)
        const wss = config.server.getWSAllConnections()
        this.WSTablesResponse({tables: tables}, wss)
        return this.jsonResponse(res, table)

    }

    async joinPlayer(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken) {

        if(session.hasTableId()) return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);

        const { table_id } = await this.getBody(req)
        const table = await this.getTable(table_id)
        if(!table) return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
        if(table.isMaxPlayersReached() || table.isGameEndReached()) return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);

        const player = new Player(session.user.user_id, session.user.name)
        const addedPlayerTable = table.addPlayer(player)

        await addedPlayerTable.updatePlayer(config.DB, session)

        // table_idが入ったJWTをクッキーにセット
        const authToken = await AuthTokenManagerFactory.create(session.user, session.id, req, res, config.tableToken, SessionManagerFactory.create(config.sessionManagement, config.DB), config.secretKey)
        await authToken.updateTable(addedPlayerTable)

        const wssHome = config.server.getWSAllConnections()
        const wssTable = config.server.getWSConnections(table.getPlayerIds())
        if(!addedPlayerTable.isMaxPlayersReached()) {
            // MongoDBのテーブル情報更新
            const tm = TableManagerFactory.create(config.mongoTable)
            const newTablesJson = await tm.updateTableJson(addedPlayerTable)
            const tables = tm.toTables(newTablesJson)
            this.WSTableResponse({table: addedPlayerTable}, wssTable)
            this.WSTablesResponse({tables: tables}, wssHome)
            return this.jsonResponse(res, table)
        }

        // MongoDBのテーブル情報更新
        const startedTable = addedPlayerTable.start()
        const tm = TableManagerFactory.create(config.mongoTable)
        const newTablesJson = await tm.updateTableJson(startedTable)
        this.insertReplay(startedTable)
        const tables = tm.toTables(newTablesJson)

        this.setTurnTimer(startedTable, wssTable)
        this.WSHidCardsTableResponse({table: startedTable}, wssTable)
        this.WSTablesResponse({tables: tables}, wssHome)

        return this.jsonResponse(res, addedPlayerTable)

    }

}

export { HomeController }