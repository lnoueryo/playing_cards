import { Model } from "../utils";

const SUITS = ['spade','clover', 'diamond', 'heart', 'joker']


class CardBase {
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

    hide() {
        return new CardBase(0, 0, 0)
    }

    convertToJson() {
        return {
            type: this.type,
            number: this.number,
            id: this.id
        };
    }
}


class RegularCard extends CardBase {

    constructor(type: number, number: number, id: number = type * 13 + number) {
        super(id, type, number);
    }
}


class JorkerCard extends CardBase {

    constructor(number: number) {
        const type = 4;
        const id = 13 * type + number
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