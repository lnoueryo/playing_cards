import { PlayerAggregate } from "../player";
import { CardBase } from "./card";
class CardAggregate {

    readonly cards;
    readonly discards;

    constructor(cards: CardBase[], discards: CardBase[] = []) {
        this.cards = cards;
        this.discards = discards;
    }

    shuffle() {
        const cards = this.cards.slice();
        let currentIndex = this.cards.length;
        let temporaryValue, randomIndex;
        // 配列の要素がなくなるまでシャッフルを繰り返す
        while (currentIndex !== 0) {
            // 残りの要素からランダムな要素を選ぶ
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            // 現在の要素とランダムに選ばれた要素を交換する
            temporaryValue = cards[currentIndex];
            cards[currentIndex] = cards[randomIndex];
            cards[randomIndex] = temporaryValue;
        }

        return new CardAggregate(cards);
    }

    handOverCards(playerAggregate: PlayerAggregate): [CardAggregate, PlayerAggregate] {
        const cardNum = 5;
        const cards = this.cards.slice();
        const newCardAggregate = new CardAggregate(cards)
        const newPlayerAggregate = playerAggregate.takeCards(cards, cardNum)
        return [newCardAggregate, newPlayerAggregate]
    }

    getCardsFromDeck(num: number) {
        return this.cards.slice(0, num)
    }

    addDiscard(card: CardBase) {
        const newDiscards = this.discards.slice();
        newDiscards.push(card);
        return new CardAggregate(this.cards, newDiscards)
    }

}

export { CardAggregate }