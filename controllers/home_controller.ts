import http from 'http';
import { Player, PlayerAggregate } from "../models/player";
import { TableBase, TableManager } from "../models/table";
import { Controller } from "./utils";
import { Session } from '../modules/auth/session';
import { server } from '../main';
import { SessionManager } from '../modules/auth';
import { CardAggregate } from '../models/card';
import { Table } from '../models/table/table';


class HomeController extends Controller {

    async index(req: http.IncomingMessage, res: http.ServerResponse, session: Session) {
        const tablesJson = await TableManager.readJsonFile()
        if(TableManager.tableNotExists(session.tableId, tablesJson)) {
            session = session.deleteTableId()
            SessionManager.writeSessions(session)
        }
        if(session.hasTableId() && TableManager.isPlaying(session, tablesJson)) return server.redirect(res, `/table/${session.tableId}`)
        return super.httpResponse(res, 'index.html')
    }

    async tables(req: http.IncomingMessage, res: http.ServerResponse) {
        const tableJson = await TableManager.readJsonFile()
        const tables = TableManager.toTables(tableJson)
        return super.jsonResponse(res, tables)
    }

    async create(req: http.IncomingMessage, res: http.ServerResponse, session: Session) {
        const {maxPlayers, maxRounds, maxGames} = await super.getBody(req) as Table
        const tablesJson = await TableManager.readJsonFile()
        if(session.hasTableId() && !TableManager.tableNotExists(session.tableId, tablesJson) && TableManager.isPlaying(session, tablesJson)) {
            return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400)
        }
        const tables = TableManager.toTables(tablesJson)
        const player = new Player(session.id, session.name)
        const playerAggregate = new PlayerAggregate()
        const newPlayerAggregate = playerAggregate.addPlayer(player)
        const cardAggregate = CardAggregate.createNewCards();
        const table = new TableBase(cardAggregate, newPlayerAggregate, maxPlayers, maxRounds, maxGames);
        tables.push(table)

        // テーブル追加&&テーブルidセッションに追加
        await TableManager.writeJsonFile(table)
        const newSession = session.joinTable(table.id)
        SessionManager.writeSessions(newSession)

        const wss = server.getWSAllConnections()
        super.WSResponse({tables: tables}, wss)
        return super.jsonResponse(res, table)
    }

    async joinPlayer(req: http.IncomingMessage, res: http.ServerResponse, session: Session, params: {[key: string]: string} = {id: ''}) {
        const tablesJson = await TableManager.readJsonFile()
        if(session.hasTableId() && await TableManager.isPlaying(session, tablesJson)) return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400);
        if(TableManager.tableNotExists(params.id, tablesJson)) return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400);

        const player = new Player(session.data.id, session.data.name)
        const tableJson = tablesJson[params.id]
        const table = TableBase.createTable(tableJson)
        if(table.isMaxPlayersReached()) return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400);

        let addedPlayerTable = table.addPlayer(player)

        if(addedPlayerTable.isMaxPlayersReached()) {
            addedPlayerTable = addedPlayerTable.start()
        }

        const newTablesJson = await TableManager.writeJsonFile(addedPlayerTable)
        const tables = TableManager.toTables(newTablesJson)
        const newSession = session.joinTable(addedPlayerTable.id)
        SessionManager.writeSessions(newSession)

        const wssHome = server.getWSAllConnections()
        super.WSResponse({tables: tables}, wssHome)

        const wssTable = server.getWSConnections(table.playerAggregate.players.map((player) => player.id))
        super.WSResponse({table: addedPlayerTable}, wssTable)

        return super.jsonResponse(res, addedPlayerTable)

    }
}

export { HomeController }