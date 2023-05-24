import { Model } from "../utils";

const SUITS = ['spade','clover', 'diamond', 'heart', 'joker']


class CardBase implements Model {
    readonly id: number;
    readonly type: number;
    readonly number: number;
    constructor(id: number, type: number, number: number) {
        this.id = id;
        this.type = type;
        this.number = number;
    }
    static createCard(card: Card) {
        return card["type"] === 4 ? new JorkerCard(card["number"]) : new RegularCard(card["type"], card["number"])
    }
}

class RegularCard extends CardBase {
    constructor(type: number, number: number) {
        const id = type * 13 + number
        super(id, type, number);
    }
}

class JorkerCard extends CardBase {
    constructor(number: number) {
        const id = 13 * 4 + number
        super(id, 4, number);
    }
    get name() {
        return '';
    }
}

interface Card {
    "id": number,
    "type": number,
    "number": number
}
export {CardBase, RegularCard, JorkerCard, Card}