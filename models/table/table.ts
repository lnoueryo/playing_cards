import { Model } from "../utils";
import { CardBase, CardAggregate } from '../card'
import { Player, PlayerAggregate } from '../player';
import { v4 as uuidv4 } from 'uuid';

class Table {

    readonly cardAggregate: CardAggregate;
    readonly playerAggregate: PlayerAggregate;
    readonly id: string;
    readonly maxPlayers: number;
    readonly maxRounds: number = 3;
    readonly maxGames: number = 2;
    readonly game: number;
    readonly round: number;
    readonly turn: number;

    constructor(cardAggregate: CardAggregate, playerAggregate: PlayerAggregate, maxPlayers: number, maxRounds: number, maxGames: number, id: string = uuidv4(), game: number = 0, round: number = 0, turn: number = 0) {
        this.cardAggregate = cardAggregate;
        this.playerAggregate = playerAggregate;
        this.maxPlayers = maxPlayers;
        this.maxRounds = maxRounds;
        this.maxGames = maxGames;
        this.id = id;
        this.game = game;
        this.round = round;
        this.turn = turn;
    }

    addPlayer(player: Player) {
        const newPlayerAggregate = this.playerAggregate.addPlayer(player);
        return new Table(this.cardAggregate, newPlayerAggregate, this.maxPlayers, this.maxRounds, this.maxGames, this.id, this.game);
    }

    start() {
        const shuffledCardsTable = this.shuffleCards()
        const shuffledPlayersTable = shuffledCardsTable.shufflePlayers();
        const handedOverTable = shuffledPlayersTable.handOverCards();
        return handedOverTable.drawCard()
    }

    prepareNextGame() {
        const newPlayerAggregate = this.playerAggregate.discardAll()
        const newCardAggregate = CardAggregate.createNewCards()
        const resetTable = new Table(newCardAggregate, newPlayerAggregate, this.maxPlayers, this.maxRounds, this.maxGames, this.id, this.game)
        return resetTable.shuffleCards()
    }

    endGame() {
        return new Table(this.cardAggregate, this.playerAggregate, this.maxPlayers, this.maxRounds, this.maxGames, this.id, this.game + 1);
    }

    shuffleCards() {
        const cardAggregate = this.cardAggregate.shuffle()
        return new Table(cardAggregate, this.playerAggregate, this.maxPlayers, this.maxRounds, this.maxGames, this.id, this.game);
    }

    shufflePlayers() {
        const playerAggregate = this.playerAggregate.shuffle()
        return new Table(this.cardAggregate, playerAggregate, this.maxPlayers, this.maxRounds, this.maxGames, this.id, this.game);
    }

    handOverCards() {
        const [newCardAggregate, newPlayerAggregate] = this.cardAggregate.handOverCards(this.playerAggregate);
        return new Table(newCardAggregate, newPlayerAggregate, this.maxPlayers, this.maxRounds, this.maxGames, this.id, this.game);
    }

    drawCard() {
        const [newCardAggregate, newPlayerAggregate] =  this.playerAggregate.drawCard(this.cardAggregate, this.turn);
        return new Table(newCardAggregate, newPlayerAggregate, this.maxPlayers, this.maxRounds, this.maxGames, this.id, this.game, this.round, this.turn);
    }

    discard(card: CardBase) {
        const newPlayerAggregate = this.playerAggregate.discard(card, this.turn);
        const newCardAggregate = this.cardAggregate.addDiscard(card);
        const turn = this.nextTurn();
        const round = this.nextRound()
        return new Table(newCardAggregate, newPlayerAggregate, this.maxPlayers, this.maxRounds, this.maxGames, this.id, this.game, round, turn);
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

    // determineWinner() {
    //     const playerAggregate = this.playerAggregate.determineWinner()
    //     playerAggregate.players.forEach((player) => {
    //         console.log(player.hand.ranking.getRankName('jp'))
    //     })
    //     return new Table(this.cardAggregate, playerAggregate, this.maxPlayers, this.maxRounds, this.maxGames, this.id, this.game, this.round, this.turn);
    // }

    leaveTable(id: number) {
        const playerAggregate = this.playerAggregate.leaveTable(id)
        return new Table(this.cardAggregate, playerAggregate, this.maxPlayers, this.maxRounds, this.maxGames, this.id, this.game)
    }

    getPlayerInTurn(): Player {
        return this.playerAggregate.getPlayerInTurn(this.turn)
    }

    getWinner(): Player {
        return this.playerAggregate.getWinner()
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

    isAfterGameEnd() {
        return this.playerAggregate.isAfterGameEnd() && this.round == 0 && this.turn == 0;
    }

    isBeforeNextGameStart() {
        return this.playerAggregate.isBeforeNextGameStart()
    }

    otherPlayersNotExist() {
        return this.playerAggregate.otherPlayersNotExist()
    }

    getPlayerIds() {
        return this.playerAggregate.getPlayerIds()
    }

    static createTable(tableData: TableJson) {

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

        return new Table(cardAggregate, playerAggregate, maxPlayers, maxRounds, maxGames, id, game, round, turn);
    }

    convertToJson(): TableJson {
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
        } as TableJson;
    }

}

interface TableJson {
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

export { Table, TableJson }