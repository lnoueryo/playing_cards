import { Model } from "../utils";
import { CardBase, Card } from "../card";
import { PlayerAggregate } from './player_aggregate'


class Player implements Model {
    readonly id;
    readonly name;
    readonly cards;
    constructor(id: number, name: string, cards: CardBase[] = []) {
        this.id = id;
        this.name = name;
        this.cards = cards
    }
    addCard(card: CardBase) {
        const cards = this.cards.slice();
        cards.push(card);
        return new Player(this.id, this.name, cards)
    }
    discard(unwantedCard: CardBase) {
        const cards = this.cards.filter((card) => card.id != unwantedCard.id);
        return new Player(this.id, this.name, cards)
    }
    static createPlayer(playerJson: PlayerType) {
        const cards = playerJson.cards.map((card) => CardBase.createCard(card))
        return new Player(playerJson["id"], playerJson["name"], cards);
    }

}

interface PlayerType {
    id: number,
    name: string,
    cards: Card[]
}

export { Player, PlayerAggregate, PlayerType }