import http from 'http';
import { Player, PlayerAggregate } from "../models/player";
import { TableBase } from "../models/table";
import { Controller } from "./utils";
class TableController extends Controller {
    private tables: {[key: number]: TableBase} = {}
    index(req: http.IncomingMessage, res: http.ServerResponse) {
        return super.httpResponse(res, 'index.html')
    }

    create(req: http.IncomingMessage, res: http.ServerResponse) {
        const player = new Player('Rio')
        const playerAggregate = new PlayerAggregate()
        const newPlayerAggregate = playerAggregate.addPlayer(player)
        const cardAggregate = TableBase.createCards();
        const table = new TableBase(cardAggregate, newPlayerAggregate);
        this.tables[table.id] = table;
        return super.jsonResponse(res, table)
    }

    joinPlayer(req: http.IncomingMessage, res: http.ServerResponse) {
        const player = new Player('Ryl')
        this.tables[0] = this.tables[0].addPlayer(player)
        return super.jsonResponse(res, this.tables[0])
    }

    start(req: http.IncomingMessage, res: http.ServerResponse) {
        this.tables[0] = this.tables[0].shuffle().handOverCards()
        return super.jsonResponse(res, this.tables[0])
    }

    draw(req: http.IncomingMessage, res: http.ServerResponse) {
        console.log(req)
        this.tables[0] = this.tables[0].drawCard()
        console.log(this.tables[0].playerAggregate.players[this.tables[0].turn])
        return super.jsonResponse(res, this.tables[0])
    }

    discard(req: http.IncomingMessage, res: http.ServerResponse) {
        const card = this.tables[0].playerAggregate.players[this.tables[0].turn].cards[0];
        this.tables[0] = this.tables[0].discard(card);
        console.log(this.tables[0].playerAggregate.players[this.tables[0].turn])
        return super.jsonResponse(res, this.tables[0]);
    }

}

export { TableController }