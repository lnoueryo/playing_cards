import { Model } from "../utils";
import { CardBase, RegularCard, JorkerCard, CardAggregate } from '../card'
import { Player, PlayerAggregate } from '../player';
import { v4 as uuidv4 } from 'uuid';

class TableBase implements Model {

    readonly cardAggregate: CardAggregate;
    readonly playerAggregate: PlayerAggregate;
    readonly id: string;
    readonly maxPlayers: number;
    readonly turn: number;

    constructor(cardAggregate: CardAggregate, playerAggregate: PlayerAggregate, id: string = uuidv4(), maxPlayers = 3, turn: number = 0) {
        this.cardAggregate = cardAggregate;
        this.playerAggregate = playerAggregate;
        this.id = id;
        this.maxPlayers = maxPlayers;
        this.turn = turn;
    }

    addPlayer(player: Player) {
        const newPlayerAggregate = this.playerAggregate.addPlayer(player);
        return new TableBase(this.cardAggregate, newPlayerAggregate, this.id, this.maxPlayers);
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
        const resetTable = new TableBase(newCardAggregate, newPlayerAggregate, this.id, this.maxPlayers, 0)
        const shuffledCardsTable = resetTable.shuffleCards()
        const handedOverTable = shuffledCardsTable.handOverCards();
        return handedOverTable.drawCard();
    }

    shuffleCards() {
        const cardAggregate = this.cardAggregate.shuffle()
        return new TableBase(cardAggregate, this.playerAggregate, this.id, this.maxPlayers);
    }

    shufflePlayers() {
        const playerAggregate = this.playerAggregate.shuffle()
        return new TableBase(this.cardAggregate, playerAggregate, this.id, this.maxPlayers);
    }

    handOverCards() {
        const [newCardAggregate, newPlayerAggregate] = this.cardAggregate.handOverCards(this.playerAggregate);
        return new TableBase(newCardAggregate, newPlayerAggregate, this.id, this.maxPlayers);
    }

    drawCard() {
        const [newCardAggregate, newPlayerAggregate] =  this.playerAggregate.drawCard(this.cardAggregate, this.turn);
        return new TableBase(newCardAggregate, newPlayerAggregate, this.id, this.maxPlayers, this.turn);
    }

    discard(card: CardBase) {
        const newPlayerAggregate = this.playerAggregate.discard(card, this.turn);
        const newCardAggregate = this.cardAggregate.addDiscard(card);
        const turn = this.nextTurn();
        return new TableBase(newCardAggregate, newPlayerAggregate, this.id, this.maxPlayers, turn)
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
        const id = tableData["id"];
        const maxPlayers = tableData["maxPlayers"];
        const turn = tableData["turn"];

        const cardAggregate = CardAggregate.createCards(cardsJson, discardsJsonData)
        const playerAggregate = PlayerAggregate.createPlayers(playersJson)

        return new TableBase(cardAggregate, playerAggregate, id, maxPlayers, turn);
    }

    convertToTable(): Table {

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
            id: this.id,
            turn: this.turn,
            maxPlayers: this.maxPlayers
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
    "id": string,
    "maxPlayers": number,
    "turn": number,
}

export { TableBase, Table }