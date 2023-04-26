import { TableBase } from "./table";
import { CardBase } from "../card";
import { Player } from "../player";

class Porker extends TableBase {

    // constructor(cards: CardBase[], players: Player[], turn: number = 0) {
    //     super(cards, players, turn);
    // }

    // addPlayer(player: Player) {
    //     if(this.players.length > 5) {
    //         throw 'Over Players'
    //     }
    //     return super.addPlayer(player)
    //     const [cards, players] = super.addPlayer(player)
    //     return new Porker(cards, players)
    // }

    // shuffle() {
    //     const [cards, players] = super.shuffle()
    //     return new Porker(cards, players)
    // }
}

export { Porker }