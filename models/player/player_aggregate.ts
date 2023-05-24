import { Player, PlayerType } from ".";
import { CardAggregate, CardBase } from "../card";


class PlayerAggregate {

    readonly players: Player[];

    constructor(players: Player[] = []) {
        this.players = players;
    }

    addPlayer(player: Player) {
        const players = this.players.slice();
        players.push(player);
        return new PlayerAggregate(players);
    }

    discardAll() {
        const newPlayers = this.players.map((player) => {
            return new Player(player.id, player.name)
        })
        return new PlayerAggregate(newPlayers)
    }

    shuffle() {
        const players = this.players.slice();
        let currentIndex = this.players.length;
        let temporaryValue, randomIndex;
        // 配列の要素がなくなるまでシャッフルを繰り返す
        while (currentIndex !== 0) {
            // 残りの要素からランダムな要素を選ぶ
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            // 現在の要素とランダムに選ばれた要素を交換する
            temporaryValue = players[currentIndex];
            players[currentIndex] = players[randomIndex];
            players[randomIndex] = temporaryValue;
        }

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
        const discards = cardAggregate.discards.slice();
        const newCardAggregate = new CardAggregate(remainingCards, discards)
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

    static createPlayers(playersJson: PlayerType[]) {
        const players = playersJson.map(player => {
            return Player.createPlayer(player);
        });
        return new PlayerAggregate(players)
    }

    get currentPlayerCount(): number {
        return this.players.length;
    }

}

export { PlayerAggregate }