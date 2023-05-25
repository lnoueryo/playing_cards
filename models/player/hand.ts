import { CardBase, Card } from "../card";


class Hand {

    readonly cards: CardBase[]

    constructor(cards: CardBase[] = []) {
        this.cards = cards;
    }

    addCard(card: CardBase) {
        const cards = this.cards.slice();
        cards.push(card);
        return new Hand(cards)
    }

    discard(unwantedCard: CardBase) {
        const cards = this.cards.filter((card) => card.id != unwantedCard.id);
        return new Hand(cards)
    }

    convertToJson() {
        return {
            cards: this.cards.map(card => card.convertToJson())
        }
    }

    static createHand(handJson: HandType) {
        const cards =  handJson.cards.map((card) => CardBase.createCard(card))
        return new Hand(cards)
    }

}

interface HandType {
    cards: Card[]
}

export { Hand }