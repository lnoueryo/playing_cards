import { Model } from "../utils";
import { CardBase, RegularCard, JorkerCard, CardAggregate } from '../card'
import { Player, PlayerAggregate } from '../player';
class TableBase implements Model {

    protected _cardAggregate;
    protected _playerAggregate;
    protected _turn;

    constructor(cardAggregate: CardAggregate, playerAggregate: PlayerAggregate, turn: number = 0) {
        this._cardAggregate = cardAggregate;
        this._playerAggregate = playerAggregate;
        this._turn = turn;
    }

    addPlayer(player: Player) {
        const newPlayerAggregate = this.playerAggregate.addPlayer(player);
        return [this.cardAggregate, newPlayerAggregate];
    }

    shuffle() {
        const newCardAggregate = this.cardAggregate.shuffle()

        return [newCardAggregate, this.playerAggregate];
    }

    handOverCards() {
        return this.cardAggregate.handOverCards(this.playerAggregate);
    }

    drawCard() {
        return this.playerAggregate.drawCard(this.cardAggregate, this.turn);
    }

    discard(card: CardBase) {
        const newPlayerAggregate = this.playerAggregate.discard(card, this.turn);
        const newCardAggregate = this.cardAggregate.addDiscard(card);
        const turn = this.nextTurn();
        return [newCardAggregate, newPlayerAggregate, turn];
    }

    protected nextTurn() {
        if(this.playerAggregate.hasCompletedFullRound(this.turn)) return 0;
        return this.turn + 1;
    }

    private displayPlayers() {
        this.playerAggregate.players.forEach((player, index) => {
            console.log(`Player ${index + 1}: ${player.name}`);
            console.log("Cards:");
            player.cards.forEach((card) => {
              console.log(`- ${card.id} ${card.type} ${card.number ? card.number : ""}`);
            });
            console.log("-----");
        });
    }

    get cardAggregate() {
        return this._cardAggregate;
    }

    get playerAggregate() {
        return this._playerAggregate;
    }

    get turn() {
        return this._turn;
    }

    static createCards() {
        const suits = ['jack', 'spade', 'heart', 'diamond']
        const cards: CardBase[] = []

        for (let i = 0; i < suits.length; i++) {
            for (let j = 1; j < 14; j++) {
                const card = new RegularCard(suits[i], j);
                cards.push(card)
            }
        }

        for (let i = 0; i < 2; i++) {
            const joker = new JorkerCard('joker')
            cards.push(joker)
        }

        return new CardAggregate(cards);
    }

}

export { TableBase }