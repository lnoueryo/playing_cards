import http from 'http';
import { Player, PlayerAggregate } from "../models/player";
import { TableBase } from "../models/table";
import { Controller } from "./utils";
class TableController extends Controller {

    static index(req: http.IncomingMessage, res: http.ServerResponse) {
        return super.httpResponse(res, 'index.html')
    }

    static create(req: http.IncomingMessage, res: http.ServerResponse) {
        const player = new Player('Rio')
        const playerAggregate = new PlayerAggregate()
        const newPlayerAggregate = playerAggregate.addPlayer(player)
        const cardAggregate = TableBase.createCards();
        const table = new TableBase(cardAggregate, newPlayerAggregate);
        return super.jsonResponse(res, table)
    }
}

export { TableController }