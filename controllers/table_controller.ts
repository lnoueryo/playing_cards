import http from 'http';
import { Player, PlayerAggregate } from "../models/player";
import { TableBase, TableManager } from "../models/table";
import { Controller } from "./utils";
class TableController extends Controller {

    index(req: http.IncomingMessage, res: http.ServerResponse) {
        return super.httpResponse(res, 'index.html')
    }

    async create(req: http.IncomingMessage, res: http.ServerResponse) {
        const player = new Player(0, 'Rio')
        const playerAggregate = new PlayerAggregate()
        const newPlayerAggregate = playerAggregate.addPlayer(player)
        const cardAggregate = TableBase.createCards();
        const table = new TableBase(cardAggregate, newPlayerAggregate);
        await TableManager.writeJsonFile(table)
        super.WSResponse(table)
        return super.jsonResponse(res, table)
    }

    async joinPlayer(req: http.IncomingMessage, res: http.ServerResponse) {
        const player = new Player(1, 'Ryl')
        const tablesJson = await TableManager.readJsonFile()
        const table = TableBase.createTable(tablesJson[0])
        const addedPlayerTable = table.addPlayer(player)
        await TableManager.writeJsonFile(addedPlayerTable)
        super.WSResponse(addedPlayerTable)
        return super.jsonResponse(res, addedPlayerTable)
    }

    async start(req: http.IncomingMessage, res: http.ServerResponse) {
        const tablesJson = await TableManager.readJsonFile()
        const table = TableBase.createTable(tablesJson[0])
        const handedOverTable = table.shuffle().handOverCards()
        await TableManager.writeJsonFile(handedOverTable)
        super.WSResponse(handedOverTable)
        return super.jsonResponse(res, handedOverTable)
    }

    async draw(req: http.IncomingMessage, res: http.ServerResponse) {
        const tablesJson = await TableManager.readJsonFile()
        const table = TableBase.createTable(tablesJson[0])
        const drawnTable = table.drawCard()
        await TableManager.writeJsonFile(drawnTable)
        super.WSResponse(drawnTable)
        return super.jsonResponse(res, drawnTable)
    }

    async discard(req: http.IncomingMessage, res: http.ServerResponse) {
        const tablesJson = await TableManager.readJsonFile()
        const table = TableBase.createTable(tablesJson[0])
        const card = table.playerAggregate.players[table.turn].cards[0];
        const discardedTable = table.discard(card)
        await TableManager.writeJsonFile(discardedTable)
        super.WSResponse(discardedTable)
        return super.jsonResponse(res, discardedTable);
    }

}

export { TableController }