import { Player } from ".";
import { CardAggregate, CardBase } from "../card";


class PlayerAggregate {

    readonly players;

    constructor(players: Player[] = []) {
        this.players = players;
    }

    addPlayer(player: Player) {
        const players = this.players.slice();
        players.push(player);
        return new PlayerAggregate(players);
    }

    takeCards(cards: CardBase[], cardNum: number) {
        const players = this.players.map(player => {
            const playerCards = cards.slice(0, cardNum);
            cards.splice(0, cardNum);
            const newPlayer = playerCards.reduce((p, card) => p.addCard(card), player);
            return newPlayer;
        });
        return new PlayerAggregate(players)
    }

    drawCard(cardAggregate: CardAggregate, turn: number): [CardAggregate, PlayerAggregate] {
        const playerCard = cardAggregate.getCardsFromDeck(1)[0];
        const newPlayer = this.players[turn].addCard(playerCard);
        const newPlayers = this.players.slice();
        newPlayers[turn] = newPlayer;
        const remainingCards = cardAggregate.cards.slice(1);
        const newCardAggregate = new CardAggregate(remainingCards)
        const newPlayerAggregate = new PlayerAggregate(newPlayers)
        return [newCardAggregate, newPlayerAggregate];
    }

    discard(card: CardBase, turn: number) {
        const newPlayer = this.players[turn].discard(card);
        const newPlayers = this.players.slice();
        newPlayers[turn] = newPlayer;
        return new PlayerAggregate(newPlayers);
    }

    hasCompletedFullRound(turn: number) {
        return turn >= this.players.length;
    }

}

export { PlayerAggregate }