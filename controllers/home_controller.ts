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

            // TODO デッドコード。hasTableIdはtables_usersを参照しに行くもしくはsessionで一緒に取得する
            if(session.hasTableId()) {
                if(!tm.tableNotExists(session.user.table_id, tablesJson)) {
                    const table = Table.createTable(tablesJson[session.user.table_id])
                    if(table.isAfterGameEnd()) {
                        // 通信障害などにより、トークンをセットできなかった可能性あり
                        // console.warn(`User has the token ${}`)
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
        } finally {
            return session
        }
    }

    async tables(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken) {

        try {

            const tables = await this.getTables()
            this.jsonResponse(res, tables)
        } catch (error) {
            console.error(error)
            return super.jsonResponse(res, {}, 500);
        } finally {
            return session
        }
    }

    async create(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken) {

        try {

            const cfg = await config;
            const {maxPlayers, maxRounds, maxGames} = await this.getBody(req) as Table
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

            const timer = setTimeout(async() => {
                const newtable = await this.getTable(table.id)
                if(!newtable) return;
                const userIds = newtable.getPlayerIds()
                await table.deleteTable(cfg.DB, userIds)
                await tm.deleteTableJson(newtable)
                await cfg.rmqc.deleteQueue(table.id)
                const tables = await this.getTables()
                const wssTable = cfg.server.getWSConnections(userIds)
                const wssHome = cfg.server.getWSAllConnections()
                this.WSTableResponse({table: ''}, wssTable)
                this.WSTablesResponse({tables: tables}, wssHome)
            }, this.startGameTimeout);

            this.startGameTimers.set(table.id, timer)
            const wss = cfg.server.getWSAllConnections()
            this.WSTablesResponse({tables: tables}, wss)
            this.jsonResponse(res, table)
        } catch (error) {
            console.error(error)
            return super.jsonResponse(res, {}, 500);
        } finally {
            return session
        }

    }

    async joinPlayer(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken) {

        try {
            const cfg = await config;
            if(session.hasTableId()) return this.jsonResponse(res, {"message": "Invalid request parameters"}, 400);

            const body = await this.getBody(req)
            const table_id = body.table_id
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
            await authToken.createTable(addedPlayerTable.id)

            const wssHome = cfg.server.getWSAllConnections()
            const wssTable = cfg.server.getWSConnections(addedPlayerTable.getPlayerIds())
            if(!addedPlayerTable.isMaxPlayersReached()) {
                // MongoDBのテーブル情報更新
                const tm = TableManagerFactory.create(cfg.mongoTable)
                tm.updateTableJson(addedPlayerTable)
                const tables = await this.getTables()
                this.WSTableResponse({table: addedPlayerTable}, wssTable)
                this.WSTablesResponse({tables: tables}, wssHome)
                this.jsonResponse(res, addedPlayerTable)
                return session
            }

            // MongoDBのテーブル情報更新
            console.info(`${new Date().toISOString()} - Event: Start Game - Table ID: ${addedPlayerTable.id} - Player IDs: ${addedPlayerTable.getPlayerIds()}`)
            const startedTable = addedPlayerTable.start()
            const timer = this.startGameTimers.get(startedTable.id)
            clearInterval(timer)

            const tm = TableManagerFactory.create(cfg.mongoTable)
            await tm.updateTableJson(startedTable)
            this.insertReplay(startedTable)
            const tables = await this.getTables()

            this.setTurnTimer(startedTable, wssTable)
            this.WSHidCardsTableResponse({table: startedTable}, wssTable)
            this.WSTablesResponse({tables: tables}, wssHome)

            this.jsonResponse(res, addedPlayerTable)

        } catch (error) {
            console.error(error)
            return super.jsonResponse(res, {}, 500);
        } finally {

            return session
        }

    }

}

export { HomeController }