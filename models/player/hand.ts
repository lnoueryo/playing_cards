import { CardBase, Card, RegularCard } from "../card";
import { Ranking } from "./ranking";


class Hand {

    readonly cards: CardBase[]
    readonly maxCards = 6;
    readonly ranking: Ranking

    constructor(cards: CardBase[] = [], ranking: Ranking = new Ranking(0, 0)) {
        this.cards = cards;
        this.ranking = ranking;
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

    getDrawnCard() {
        return this.cards[this.cards.length - 1]
    }

    getRankName(lang: string) {
        return this.ranking.getRankName(lang)
    }

    hideCards() {
        const cards = this.cards.map((card) => {
            return card.hide()
        })
        return new Hand(cards, this.ranking)
    }

    analyzeHand() {
        let bestHand = new Ranking(0, 0);
        if(this.hasNoCard()) return new Hand(this.cards, bestHand);
        const hands = this.generateHands();

        for (const hand of hands) {
            const sortedCards = hand.sortedCards;
            const uniqueNumbers = new Set(sortedCards.map(card => card.number));
            const isFlush = new Set(sortedCards.map(card => card.type)).size === 1;
            const isStraight = this.isStraight(sortedCards);
            let rank = 0;
            if (uniqueNumbers.size === 1) rank = 9; // Five of a Kind
            else if (isFlush && isStraight) rank = 8; // Straight Flush
            else if (uniqueNumbers.size === 2) {
                if (sortedCards[0].number === sortedCards[3].number || sortedCards[1].number === sortedCards[4].number) rank = 7; // Four of a Kind
                else rank = 6; // Full House
            }
            else if (isFlush) rank = 5; // Flush
            else if (isStraight) rank = 4; // Straight
            else if (uniqueNumbers.size === 3) {
                if (sortedCards[0].number === sortedCards[2].number || sortedCards[1].number === sortedCards[3].number || sortedCards[2].number === sortedCards[4].number) rank = 3; // Three of a Kind
                else rank = 2; // Two Pairs
            }
            else if (uniqueNumbers.size === 4) rank = 1; // One Pair
            if (bestHand.isHandBetter(rank, sortedCards[0].number)) bestHand = new Ranking(rank, sortedCards[0].number);
        }
        return new Hand(this.cards, bestHand);
    }

    protected generateHands(): Hand[] {
        const cards = this.cards.slice()
        if(this.isDrawnCard()) cards.pop();
        const jokers = cards.filter(card => card.type === 4);
        const nonJokers = cards.filter(card => card.type !== 4);
        let hands: Hand[] = [new Hand(nonJokers)];

        for (let joker of jokers) {
            let newHands: Hand[] = [];
            for (let hand of hands) {
                for (let number = 1; number <= 13; number++) {
                    for (let type = 0; type < 4; type++) {
                        let newHand = new Hand([...hand.cards, new RegularCard(type, number, joker.id)]);
                        newHands.push(newHand);
                    }
                }
            }
            hands = newHands;
        }

        return hands;
    }

    isStraight(cards: CardBase[]): boolean {
        // First, handle the special case of a "wheel" straight (A, 2, 3, 4, 5).
        // In this case, sort the cards so the ace is high, and check if it's a 5-high straight.
        let wheelCards = [...cards];
        wheelCards.sort((a, b) => a.number === 1 ? 14 : a.number - b.number);
        if (wheelCards.every((card, i, arr) => i === 0 || card.number === arr[i - 1].number - 1)) {
            return true;
        }
        // If not, check for a normal straight.
        return cards.every((card, i, arr) => i === 0 || card.number === arr[i - 1].number - 1);
    }

    // TODO hasUniqueNumbers hasPairs countDuplicateNumbersは不要かも
    hasUniqueNumbers(num: number) {
        return this.countDuplicateNumbers().some((obj) => obj.count == num)
    }

    hasPairs(num: number) {
        return this.countDuplicateNumbers().length == num;
    }

    countDuplicateNumbers(): NumberCount[] {
        const numberCountMap: Record<number, number> = this.cards.reduce((acc: Record<number, number>, card) => {
            if (acc[card.number]) acc[card.number]++;
            else acc[card.number] = 1;
            return acc;
        }, {});

        const numberCounts: NumberCount[] = Object.entries(numberCountMap)
          .filter(([_, count]) => count > 1)
          .map(([number, count]) => ({ number: parseInt(number), count: count }));

        return numberCounts;
    }

    get sortedCards() {
        return this.cards.sort((a, b) => b.number - a.number)
    }

    isCorrectNumberCards() {
        return this.cards.length == this.maxCards - 1;
    }

    hasNoCard() {
        return this.cards.length == 0;
    }

    isDrawnCard() {
        return this.cards.length == this.maxCards;
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

interface NumberCount {
    number: number;
    count: number;
}

export { Hand }