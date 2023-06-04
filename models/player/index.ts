import { Model } from "../utils";
import { CardBase, Card } from "../card";
import { PlayerAggregate } from './player_aggregate'
import { Hand } from "./hand";


class Player {

    readonly id: number;
    readonly name: string;
    readonly hand: Hand;

    constructor(id: number, name: string, hand: Hand = new Hand()) {
        this.id = id;
        this.name = name;
        this.hand = hand;
    }

    addCard(card: CardBase) {
        return new Player(this.id, this.name, this.hand.addCard(card))
    }

    discard(unwantedCard: CardBase) {
        return new Player(this.id, this.name, this.hand.discard(unwantedCard))
    }

    analyzeHand() {
        const hand = this.hand.analyzeHand()
        return new Player(this.id, this.name, hand);
    }

    getDrawnCard() {
        if(this.hand.cards.length != 6) throw new Error(`the player in turn doesn't have correct number of cards: ${this.hand.cards.length}`)
        return this.hand.getDrawnCard()
    }

    getRankName(lang: string) {
        return this.hand.getRankName(lang)
    }

    isWaiting() {
        return this.hand.isCorrectNumberCards();
    }

    hasNoCard() {
        return this.hand.hasNoCard()
    }

    isInTurn() {
        return this.hand.isDrawnCard()
    }

    getRank() {
        return this.hand.ranking
    }

    convertToJson() {
        return {
            id: this.id,
            name: this.name,
            hand: this.hand.convertToJson()
        };
    }

    static createPlayer(playerJson: PlayerType) {
        const cards = Hand.createHand(playerJson["hand"])
        return new Player(playerJson["id"], playerJson["name"], cards);
    }

}

interface PlayerType {
    id: number,
    name: string,
    hand: {
        cards: Card[]
    }
}

export { Player, PlayerAggregate, PlayerType, Hand }