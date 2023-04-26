import { Model } from "../utils";
import { CardBase } from "../card";
import { PlayerAggregate } from './player_aggregate'
class Player implements Model {
    protected _name;
    protected _cards;
    constructor(name: string, cards: CardBase[] = []) {
        this._name = name;
        this._cards = cards
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
    get name() {
        return this._name;
    }
    get cards() {
        return this._cards;
    }
}

export { Player, PlayerAggregate }