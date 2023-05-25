import { CardBase, JorkerCard, Card, RegularCard } from "../card";
import { Hand, Player } from "../player";
import { HandRanking } from "./hand_ranking";


class PokerJudge {

    readonly players: Player[]

    constructor(players: Player[]) {
        this.players = players;
    }

    analyzeHand(hand: Hand): HandRanking {
        const hands = this.generateHands(hand);
        let bestHand = { rank: 0, highCard: 0 };
        for (const hand of hands) {
            const sortedCards = [...hand.cards].sort((a, b) => b.number - a.number);
            const uniqueNumbers = new Set(sortedCards.map(card => card.number));
            const isFlush = new Set(sortedCards.map(card => card.type)).size === 1;
            const isStraight = this.isStraight(sortedCards);
            // Determine the rank of this hand
            let rank = 0;
            if (uniqueNumbers.size === 1) {
                rank = 9; // Five of a Kind
            } else if (uniqueNumbers.size === 2) {
                if (sortedCards[0].number === sortedCards[3].number || sortedCards[1].number === sortedCards[4].number) {
                    rank = 7; // Four of a Kind
                } else {
                    rank = 6; // Full House
                }
            } else if (isFlush && isStraight) {
                rank = 8; // Straight Flush
            } else if (isFlush) {
                rank = 5; // Flush
            } else if (isStraight) {
                rank = 4; // Straight
            } else if (uniqueNumbers.size === 3) {
                if (sortedCards[0].number === sortedCards[2].number || sortedCards[1].number === sortedCards[3].number || sortedCards[2].number === sortedCards[4].number) {
                    rank = 3; // Three of a Kind
                } else {
                    rank = 2; // Two Pairs
                }
            } else if (uniqueNumbers.size === 4) {
                rank = 1; // One Pair
            }
            if (rank > bestHand.rank || (rank === bestHand.rank && sortedCards[0].number > bestHand.highCard)) {
                bestHand = { rank: rank, highCard: sortedCards[0].number };
            }
        }
        return bestHand;
    }

    generateHands(hand: Hand): Hand[] {
        const jokers = hand.cards.filter(card => card.type === 4);
        const nonJokers = hand.cards.filter(card => card.type !== 4);
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

    compareHands(a: HandRanking, b: HandRanking): number {
        if (a.rank !== b.rank) return b.rank - a.rank;
        return b.highCard - a.highCard;
    }

    determineWinner(): Player[] {
        this.players.sort((a, b) => this.compareHands(this.analyzeHand(a.hand), this.analyzeHand(b.hand)));
        return this.players;
    }
}

export { PokerJudge }