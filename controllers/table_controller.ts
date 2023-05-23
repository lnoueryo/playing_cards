import http from 'http';
import { Player, PlayerAggregate } from "../models/player";
import { TableBase, TableManager } from "../models/table";
import { Controller } from "./utils";
import { Session } from '../modules/auth/session';
import { server } from '../main';
import { SessionManager } from '../modules/auth';
class TableController extends Controller {

    async home(req: http.IncomingMessage, res: http.ServerResponse, session: Session) {
        if(session.hasTableId() && await TableManager.isPlaying(session)) {
            return server.redirect(res, `/table/${session.data.tableId}`)
        }
        return super.httpResponse(res, 'index.html')
    }

    async index(req: http.IncomingMessage, res: http.ServerResponse, session: Session) {
        if(!session.hasTableId() || !(await TableManager.isPlaying(session))) {
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
        const cardAggregate = TableBase.createCards();
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
        // const tableJson = await TableManager.readJsonFile()
        // const tables = TableManager.toTables(tableJson)
        // const player = new Player(session.data.id, session.data.name)
        // const playerAggregate = new PlayerAggregate()
        // const newPlayerAggregate = playerAggregate.addPlayer(player)
        // const cardAggregate = TableBase.createCards();
        // const table = new TableBase(cardAggregate, newPlayerAggregate);
        // tables.push(table)
        // await TableManager.writeJsonFile(table)
        // const wss = server.getWSAllConnections()
        // console.log(wss)
        // super.WSResponse(tables, wss)
        return super.jsonResponse(res, {})
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
        const addedPlayerTable = table.addPlayer(player)

        await TableManager.writeJsonFile(addedPlayerTable)
        const _tablesJson = await TableManager.readJsonFile()
        const tables = TableManager.toTables(_tablesJson)
        const newSession = session.joinTable(table.id)
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
        const handedOverTable = table.shuffle().handOverCards()
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

    async discard(req: http.IncomingMessage, res: http.ServerResponse) {
        const tableJson = await TableManager.readJsonFile()
        const tables = TableManager.toTables(tableJson)
        const table = tables[0]
        const card = table.playerAggregate.players[table.turn].cards[0];
        const discardedTable = table.discard(card)
        await TableManager.writeJsonFile(discardedTable)
        const wss = server.getWSConnections(table.playerAggregate.players.map((player) => player.id))
        super.WSResponse(discardedTable, wss)
        return super.jsonResponse(res, discardedTable);
    }

}

export { TableController }