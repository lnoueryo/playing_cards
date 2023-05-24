import http from 'http';
import { Player, PlayerAggregate } from "../models/player";
import { TableBase, TableManager } from "../models/table";
import { Controller } from "./utils";
import { Session } from '../modules/auth/session';
import { server } from '../main';
import { SessionManager } from '../modules/auth';
import { CardAggregate, CardBase } from '../models/card';
class TableController extends Controller {

    async home(req: http.IncomingMessage, res: http.ServerResponse, session: Session) {
        if(session.hasTableId() && await TableManager.isPlaying(session)) {
            return server.redirect(res, `/table/${session.data.tableId}`)
        }
        return super.httpResponse(res, 'index.html')
    }

    async index(req: http.IncomingMessage, res: http.ServerResponse, session: Session, params?: { [key: string]: string }) {
        if(!session.hasTableId() || !(await TableManager.isPlaying(session))) {
            return server.redirect(res, '/')
        }
        const tablesJson = await TableManager.readJsonFile()
        if(!params?.id || params.id in tablesJson == false) {
            return server.redirect(res, '/')
        }
        return super.httpResponse(res, 'table.html')
    }

    async tables(req: http.IncomingMessage, res: http.ServerResponse) {
        const tableJson = await TableManager.readJsonFile()
        const tables = TableManager.toTables(tableJson)
        return super.jsonResponse(res, tables)
    }

    async create(req: http.IncomingMessage, res: http.ServerResponse, session: Session) {
        if(session.hasTableId() && await TableManager.isPlaying(session)) {
            return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400)
        }
        const tableJson = await TableManager.readJsonFile()
        const tables = TableManager.toTables(tableJson)
        const player = new Player(session.data.id, session.data.name)
        const playerAggregate = new PlayerAggregate()
        const newPlayerAggregate = playerAggregate.addPlayer(player)
        const cardAggregate = CardAggregate.createNewCards();
        const table = new TableBase(cardAggregate, newPlayerAggregate);
        tables.push(table)
        await TableManager.writeJsonFile(table)
        const newSession = session.joinTable(table.id)
        SessionManager.writeSessions(newSession)
        const wss = server.getWSAllConnections()
        super.WSResponse({tables: tables}, wss)
        return super.jsonResponse(res, table)
    }

    async show(req: http.IncomingMessage, res: http.ServerResponse, session: Session, params?: { [key: string]: string }) {
        const tablesJson = await TableManager.readJsonFile()
        if(!params?.id || params.id in tablesJson == false) {
            return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400)
        }
        const tableJson = tablesJson[params.id]
        const table = TableBase.createTable(tableJson)
        return super.jsonResponse(res, table)
    }

    async joinPlayer(req: http.IncomingMessage, res: http.ServerResponse, session: Session, params?: { [key: string]: string }) {
        if(session.hasTableId() && await TableManager.isPlaying(session)) {
            console.log(session.hasTableId())
            return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400)
        }
        const tablesJson = await TableManager.readJsonFile()
        const player = new Player(session.data.id, session.data.name)
        if(!params?.id || params.id in tablesJson == false) {
            return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400)
        }
        const tableJson = tablesJson[params.id]
        const table = TableBase.createTable(tableJson)
        if(table.isMaxPlayersReached()) {
            return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400)
        }

        let addedPlayerTable = table.addPlayer(player)

        if(addedPlayerTable.isMaxPlayersReached()) {
            addedPlayerTable = addedPlayerTable.start()
        }
        const newTablesJson = await TableManager.writeJsonFile(addedPlayerTable)
        const tables = TableManager.toTables(newTablesJson)
        const newSession = session.joinTable(addedPlayerTable.id)
        SessionManager.writeSessions(newSession)
        const wss = server.getWSAllConnections()
        super.WSResponse({tables: tables}, wss)

        const _wss = server.getWSConnections(table.playerAggregate.players.map((player) => player.id))
        super.WSResponse({table: addedPlayerTable}, _wss)
        return super.jsonResponse(res, addedPlayerTable)

    }

    async start(req: http.IncomingMessage, res: http.ServerResponse) {
        const tableJson = await TableManager.readJsonFile()
        const tables = TableManager.toTables(tableJson)
        const table = tables[0]
        const handedOverTable = table.start()
        await TableManager.writeJsonFile(handedOverTable)
        const wss = server.getWSConnections(table.playerAggregate.players.map((player) => player.id))
        super.WSResponse(handedOverTable, wss)
        return super.jsonResponse(res, handedOverTable)
    }

    async draw(req: http.IncomingMessage, res: http.ServerResponse) {
        const tableJson = await TableManager.readJsonFile()
        const tables = TableManager.toTables(tableJson)
        const table = tables[0]
        const drawnTable = table.drawCard()
        await TableManager.writeJsonFile(drawnTable)
        const wss = server.getWSConnections(table.playerAggregate.players.map((player) => player.id))
        super.WSResponse(drawnTable, wss)
        return super.jsonResponse(res, drawnTable)
    }

    async discard(req: http.IncomingMessage, res: http.ServerResponse, session: Session, params?: { [key: string]: string }) {
        const tablesJson = await TableManager.readJsonFile()
        if(!params?.id || params.id in tablesJson == false) return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400)
        if(session.isNotMatchingTableId(session.data.tableId)) return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400)
        const tableJson = tablesJson[params.id]
        const table = TableBase.createTable(tableJson)
        const cardJson = await super.getBody(req)
        const card = CardBase.createCard(JSON.parse(cardJson))
        const discardedTable = table.discard(card)
        const drawCardTable = discardedTable.drawCard()
        await TableManager.writeJsonFile(drawCardTable)
        const wss = server.getWSConnections(drawCardTable.getPlayerIds())
        super.WSResponse({table: drawCardTable}, wss)
        return super.jsonResponse(res, drawCardTable);
    }


    async reset(req: http.IncomingMessage, res: http.ServerResponse, session: Session, params?: { [key: string]: string }) {

        const tablesJson = await TableManager.readJsonFile()
        if(!params?.id || params.id in tablesJson == false) return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400)
        if(session.isNotMatchingTableId(params.id)) return super.jsonResponse(res, {"message": "Invalid request parameters"}, 400)
        const tableJson = tablesJson[params.id]
        const table = TableBase.createTable(tableJson)
        const nextTable = table.next()
        await TableManager.writeJsonFile(nextTable)

        const _wss = server.getWSConnections(table.playerAggregate.players.map((player) => player.id))
        super.WSResponse({table: nextTable}, _wss)
        return super.jsonResponse(res, nextTable)
    }

}

export { TableController }