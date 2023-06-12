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

        try {
            const cfg = await config;
            const tm = TableManagerFactory.create(cfg.mongoTable)
            const tablesJson = await tm.getTablesJson()
    
            if(session.hasTableId()) {
                if(!tm.tableNotExists(session.user.table_id, tablesJson)) {
                    const table = Table.createTable(tablesJson[session.user.table_id])
                    if(table.isAfterGameEnd()) {
                        // 通信障害などにより、トークンをセットできなかった可能性あり
                        const authToken = await AuthTokenManagerFactory.create(session.user, session.id, req, res, cfg.tableToken, SessionManagerFactory.create(cfg.sessionManagement, cfg.DB), cfg.secretKey)
                        await authToken.createTable(session.user.table_id)
                        cfg.server.redirect(res, `/table/${session.user.table_id}`)
                        return session
                    }
                }
    
                // table_id削除
                session = await session.deleteTable(session.user.table_id)
            }
            this.httpResponse(res, 'index.html')
        } catch (error) {
            console.error(error)
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Error: Not Found');
        }
        return session
    }

    async tables(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken) {

        const tables = await this.getTables()
        this.jsonResponse(res, tables)
        return session
    }

    async create(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken) {

        const cfg = await config;
        let maxPlayers, maxRounds, maxGames;
        try {
            const body = await this.getBody(req) as Table
            maxPlayers = body.maxPlayers;
            maxRounds = body.maxRounds;
            maxGames = body.maxGames;
        } catch (error) {
            console.warn(error)
            this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
            return session
        }
        // TODO maxPlayers, maxRounds, maxGamesのバリデーション

        const tm = TableManagerFactory.create(cfg.mongoTable)
        const tables = await this.getTables()

        const player = new Player(session.user.user_id, session.user.name)
        const playerAggregate = new PlayerAggregate()
        const newPlayerAggregate = playerAggregate.addPlayer(player)
        const cardAggregate = CardAggregate.createNewCards();
        const table = new Table(cardAggregate, newPlayerAggregate, maxPlayers, maxRounds, maxGames);
        tables.push(table)

        // TODO ロールバックなど確認
        await table.createTable(cfg.DB, session)
        await cfg.rmqc.createQueue(table.id)

        // テーブル追加&&テーブルidセッションに追加
        const authToken = await AuthTokenManagerFactory.create(session.user, session.id, req, res, cfg.tableToken, SessionManagerFactory.create(cfg.sessionManagement, cfg.DB), cfg.secretKey)
        await authToken.createTable(table.id)
        if(!res.getHeader('Set-Cookie')) throw new Error("token isn't set")

        await tm.createTableJson(table)
        const wss = cfg.server.getWSAllConnections()
        this.WSTablesResponse({tables: tables}, wss)
        this.jsonResponse(res, table)
        return session

    }

    async joinPlayer(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken) {

        const cfg = await config;
        if(session.hasTableId()) return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);

        let table_id;
        try {
            const body = await this.getBody(req)
            table_id = body.table_id
        } catch (error) {
            console.warn(error)
            this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
            return session
        }
        // TODO table_idのバリデーション

        const table = await this.getTable(table_id)
        if(!table) return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
        if(table.isMaxPlayersReached() || table.isGameEndReached()) return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);

        const player = new Player(session.user.user_id, session.user.name)
        const addedPlayerTable = table.addPlayer(player)

        // TODO ロールバックなど確認
        await addedPlayerTable.updatePlayer(cfg.DB, session)

        // table_idが入ったJWTをクッキーにセット
        const authToken = await AuthTokenManagerFactory.create(session.user, session.id, req, res, cfg.tableToken, SessionManagerFactory.create(cfg.sessionManagement, cfg.DB), cfg.secretKey)
        await authToken.updateTable(addedPlayerTable)

        const wssHome = cfg.server.getWSAllConnections()
        const wssTable = cfg.server.getWSConnections(table.getPlayerIds())
        if(!addedPlayerTable.isMaxPlayersReached()) {
            // MongoDBのテーブル情報更新
            const tm = TableManagerFactory.create(cfg.mongoTable)
            const newTablesJson = await tm.updateTableJson(addedPlayerTable)
            const tables = tm.toTables(newTablesJson)
            this.WSTableResponse({table: addedPlayerTable}, wssTable)
            this.WSTablesResponse({tables: tables}, wssHome)
            this.jsonResponse(res, table)
            return session
        }

        // MongoDBのテーブル情報更新
        const startedTable = addedPlayerTable.start()
        const tm = TableManagerFactory.create(cfg.mongoTable)
        const newTablesJson = await tm.updateTableJson(startedTable)
        this.insertReplay(startedTable)
        const tables = tm.toTables(newTablesJson)

        this.setTurnTimer(startedTable, wssTable)
        this.WSHidCardsTableResponse({table: startedTable}, wssTable)
        this.WSTablesResponse({tables: tables}, wssHome)

        this.jsonResponse(res, addedPlayerTable)
        return session

    }

}

export { HomeController }