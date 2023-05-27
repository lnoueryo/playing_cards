import { Model } from "../utils";
import { CardBase, Card } from "../card";
import { PlayerAggregate } from './player_aggregate'
import { Hand } from "./hand";


class Player implements Model {

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
        if(this.hand.cards.length != 6) throw(`the player in turn doesn't have correct number of cards: ${this.hand.cards.length}`)
        return this.hand.getDrawnCard()
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