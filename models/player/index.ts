import { Model } from "../utils";
import { CardBase } from "../card";
import { PlayerAggregate } from './player_aggregate'


class Player implements Model {
    readonly name;
    readonly cards;
    constructor(name: string, cards: CardBase[] = []) {
        this.name = name;
        this.cards = cards
    }
    addCard(card: CardBase) {
        const cards = this.cards.slice();
        cards.push(card);
        return new Player(this.name, cards)
    }
    discard(unwantedCard: CardBase) {
        const cards = this.cards.filter((card) => card.id != unwantedCard.id);
        return new Player(this.name, cards)
    }

}

export { Player, PlayerAggregate }