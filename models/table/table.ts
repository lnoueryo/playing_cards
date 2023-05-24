import { Model } from "../utils";
import { CardBase, RegularCard, JorkerCard, CardAggregate } from '../card'
import { Player, PlayerAggregate } from '../player';
import { v4 as uuidv4 } from 'uuid';

class TableBase implements Model {

    readonly cardAggregate: CardAggregate;
    readonly playerAggregate: PlayerAggregate;
    readonly id: string;
    readonly maxPlayers: number;
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
        return new TableBase(newCardAggregate, newPlayerAggregate, this.maxPlayers, this.id, this.game, this.round, turn);
    }

    protected nextTurn() {
        const turn = this.turn + 1
        if(this.playerAggregate.hasCompletedFullRound(turn)) return 0;
        return turn;
    }

    isMaxPlayersReached() {
        return this.maxPlayers == this.playerAggregate.currentPlayerCount;
    }

    getPlayerIds() {
        return this.playerAggregate.getPlayerIds()
    }

    static createTable(tableData: Table) {

        const cardsJson = tableData["cardAggregate"]["cards"];
        const discardsJsonData = tableData["cardAggregate"]["discards"];
        const playersJson = tableData["playerAggregate"]["players"];
        const maxPlayers = tableData["maxPlayers"];
        const id = tableData["id"];
        const game = tableData["game"];
        const round = tableData["round"];
        const turn = tableData["turn"];

        const cardAggregate = CardAggregate.createCards(cardsJson, discardsJsonData)
        const playerAggregate = PlayerAggregate.createPlayers(playersJson)

        return new TableBase(cardAggregate, playerAggregate, maxPlayers, id, game, round, turn);
    }

    convertToJson(): Table {

        const cardData = {
          cards: this.cardAggregate.cards.map(card => {
            return {
              type: card.type,
              number: card.number,
              id: card.id
            };
          }),
          discards: this.cardAggregate.discards.map(card => {
            return {
              type: card.type,
              number: card.number,
              id: card.id
            };
          })
        };

        const playerData = {
          players: this.playerAggregate.players.map(player => {
            return {
              id: player.id,
              name: player.name,
              cards: player.cards.map(card => {
                return {
                  type: card.type,
                  number: card.number,
                  id: card.id
                };
              })
            };
          })
        };

        const table = {
            cardAggregate: cardData,
            playerAggregate: playerData,
            maxPlayers: this.maxPlayers,
            id: this.id,
            game: this.game,
            round: this.round,
            turn: this.turn,
        };

        return table as Table;
    }

}

interface Table {
    "cardAggregate": {
        "cards": [
            {
                "type": number,
                "number": number,
                "id": number
            },
        ],
        "discards": [
            {
                "type": number,
                "number": number,
                "id": number
            },
        ]
    },
    "playerAggregate": {
        "players": [
            {
                "id": number,
                "name": string,
                "cards": [
                    {
                        "type": number,
                        "number": number,
                        "id": number
                    },
                ]
            }
        ]
    },
    "maxPlayers": number,
    "id": string,
    "game": number,
    "round": number,
    "turn": number,
}

export { TableBase, Table }