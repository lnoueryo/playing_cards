import http from 'http';
import { Player, PlayerAggregate } from "../models/player";
import { TableBase, TableManager } from "../models/table";
import { Controller } from "./utils";
import { Session } from '../modules/auth/session';
import { server } from '../main';
class TableController extends Controller {

    index(req: http.IncomingMessage, res: http.ServerResponse) {
        return super.httpResponse(res, 'index.html')
    }

    async tables(req: http.IncomingMessage, res: http.ServerResponse) {
        const tableJson = await TableManager.readJsonFile()
        const tables = TableManager.toTables(tableJson)
        return super.jsonResponse(res, tables)
    }

    async create(req: http.IncomingMessage, res: http.ServerResponse, session: Session) {
        const tableJson = await TableManager.readJsonFile()
        const tables = TableManager.toTables(tableJson)
        const player = new Player(session.data.id, session.data.name)
        const playerAggregate = new PlayerAggregate()
        const newPlayerAggregate = playerAggregate.addPlayer(player)
        const cardAggregate = TableBase.createCards();
        const table = new TableBase(cardAggregate, newPlayerAggregate);
        tables.push(table)
        await TableManager.writeJsonFile(table)
        const wss = server.getWSAllConnections()
        console.log(wss)
        super.WSResponse(tables, wss)
        return super.jsonResponse(res, table)
    }

    async joinPlayer(req: http.IncomingMessage, res: http.ServerResponse) {
        const player = new Player(1, 'Ryl')
        const tableJson = await TableManager.readJsonFile()
        const tables = TableManager.toTables(tableJson)
        const table = tables[0]
        const addedPlayerTable = table.addPlayer(player)
        await TableManager.writeJsonFile(addedPlayerTable)
        const wss = server.getWSConnections(table.playerAggregate.players.map((player) => player.id))
        super.WSResponse(addedPlayerTable, wss)
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