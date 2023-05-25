import { Model } from "../utils";
import { CardBase, RegularCard, JorkerCard, CardAggregate } from '../card'
import { Player, PlayerAggregate } from '../player';
import { v4 as uuidv4 } from 'uuid';

class TableBase implements Model {

    readonly cardAggregate: CardAggregate;
    readonly playerAggregate: PlayerAggregate;
    readonly id: string;
    readonly maxPlayers: number;
    readonly maxRounds: number = 5;
    readonly maxGames: number = 2;
    readonly game: number;
    readonly round: number;
    readonly turn: number;

    constructor(cardAggregate: CardAggregate, playerAggregate: PlayerAggregate, maxPlayers: number, id: string = uuidv4(), game: number = 0, round: number = 0, turn: number = 0) {
        this.cardAggregate = cardAggregate;
        this.playerAggregate = playerAggregate;
        this.id = id;
        this.maxPlayers = maxPlayers;
        this.game = game;
        this.round = round;
        this.turn = turn;
    }

    addPlayer(player: Player) {
        const newPlayerAggregate = this.playerAggregate.addPlayer(player);
        return new TableBase(this.cardAggregate, newPlayerAggregate, this.maxPlayers, this.id, this.game);
    }

    start() {
        const shuffledCardsTable = this.shuffleCards()
        const shuffledPlayersTable = shuffledCardsTable.shufflePlayers();
        const handedOverTable = shuffledPlayersTable.handOverCards();
        return handedOverTable.drawCard()
    }

    next() {
        const newPlayerAggregate = this.playerAggregate.discardAll()
        const newCardAggregate = CardAggregate.createNewCards()
        const resetTable = new TableBase(newCardAggregate, newPlayerAggregate, this.maxPlayers, this.id, this.game)
        const shuffledCardsTable = resetTable.shuffleCards()
        const handedOverTable = shuffledCardsTable.handOverCards();
        return handedOverTable.drawCard();
    }

    shuffleCards() {
        const cardAggregate = this.cardAggregate.shuffle()
        return new TableBase(cardAggregate, this.playerAggregate, this.maxPlayers, this.id, this.game);
    }

    shufflePlayers() {
        const playerAggregate = this.playerAggregate.shuffle()
        return new TableBase(this.cardAggregate, playerAggregate, this.maxPlayers, this.id, this.game);
    }

    handOverCards() {
        const [newCardAggregate, newPlayerAggregate] = this.cardAggregate.handOverCards(this.playerAggregate);
        return new TableBase(newCardAggregate, newPlayerAggregate, this.maxPlayers, this.id, this.game);
    }

    drawCard() {
        const [newCardAggregate, newPlayerAggregate] =  this.playerAggregate.drawCard(this.cardAggregate, this.turn);
        return new TableBase(newCardAggregate, newPlayerAggregate, this.maxPlayers, this.id, this.game, this.round, this.turn);
    }

    discard(card: CardBase) {
        const newPlayerAggregate = this.playerAggregate.discard(card, this.turn);
        const newCardAggregate = this.cardAggregate.addDiscard(card);
        const turn = this.nextTurn();
        const round = this.nextRound()
        return new TableBase(newCardAggregate, newPlayerAggregate, this.maxPlayers, this.id, this.game, round, turn);
    }

    protected nextTurn() {
        const turn = this.turn + 1;
        if(this.playerAggregate.hasCompletedFullRound(turn)) return 0;
        return turn;
    }

    protected nextRound() {
        const turn = this.turn + 1;
        if(this.playerAggregate.hasCompletedFullRound(turn)) return this.round + 1;
        return this.round;
    }

    endGame() {
        return new TableBase(this.cardAggregate, this.playerAggregate, this.maxPlayers, this.id, this.game + 1, this.round, this.turn);
    }

    determineWinner() {
        const playerAggregate = this.playerAggregate.determineWinner()
        console.log(playerAggregate.players[0].hand)
        playerAggregate.players.forEach((player) => {
            player.hand.ranking.output()
        })
        return new TableBase(this.cardAggregate, playerAggregate, this.maxPlayers, this.id, this.game, this.round, this.turn);
    }

    isMaxPlayersReached() {
        return this.maxPlayers == this.playerAggregate.currentPlayerCount;
    }

    isGameEndRoundReached() {
        return this.maxRounds == this.round;
    }

    isGameEndReached() {
        return this.maxGames == this.game;
    }

    getPlayerIds() {
        return this.playerAggregate.getPlayerIds()
    }

    static createTable(tableData: Table) {

        const cardsJson = tableData["cardAggregate"]["cards"];
        const discardsJsonData = tableData["cardAggregate"]["discards"];
        const playersJson = tableData["playerAggregate"]["players"];
        const maxPlayers = tableData["maxPlayers"];
        const maxRounds = tableData["maxRounds"];
        const maxGames = tableData["maxGames"];
        const id = tableData["id"];
        const game = tableData["game"];
        const round = tableData["round"];
        const turn = tableData["turn"];

        const cardAggregate = CardAggregate.createCards(cardsJson, discardsJsonData)
        const playerAggregate = PlayerAggregate.createPlayers(playersJson)

        return new TableBase(cardAggregate, playerAggregate, maxPlayers, id, game, round, turn);
    }

    convertToJson(): Table {
        return {
            cardAggregate: this.cardAggregate.convertToJson(),
            playerAggregate: this.playerAggregate.convertToJson(),
            maxPlayers: this.maxPlayers,
            maxRounds: this.maxRounds,
            maxGames: this.maxGames,
            id: this.id,
            game: this.game,
            round: this.round,
            turn: this.turn,
        } as Table;
    }

}

interface Table {
    "cardAggregate": {
        "cards": {
            "type": number,
            "number": number,
            "id": number
        }[],
        "discards": {
            "type": number,
            "number": number,
            "id": number
        }[]
    },
    "playerAggregate": {
        "players": {
            "id": number,
            "name": string,
            "hand": {
                "cards": {
                    "type": number,
                    "number": number,
                    "id": number
                }[]
            }
        }[]
    },
    "maxPlayers": number,
    "maxRounds": number,
    "maxGames": number,
    "id": string,
    "game": number,
    "round": number,
    "turn": number,
}

export { TableBase, Table }