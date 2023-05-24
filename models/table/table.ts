import { Model } from "../utils";
import { CardBase, RegularCard, JorkerCard, CardAggregate } from '../card'
import { Player, PlayerAggregate } from '../player';
import { v4 as uuidv4 } from 'uuid';

class TableBase implements Model {

    readonly cardAggregate: CardAggregate;
    readonly playerAggregate: PlayerAggregate;
    readonly turn: number;
    readonly id: string;
    readonly maxPlayers: number;

    constructor(cardAggregate: CardAggregate, playerAggregate: PlayerAggregate, id: string = uuidv4(), turn: number = 0, maxPlayers = 3) {
        this.cardAggregate = cardAggregate;
        this.playerAggregate = playerAggregate;
        this.turn = turn;
        this.id = id;
        this.maxPlayers = maxPlayers;
    }

    addPlayer(player: Player) {
        const newPlayerAggregate = this.playerAggregate.addPlayer(player);
        return new TableBase(this.cardAggregate, newPlayerAggregate, this.id);
    }

    start() {
        const shuffledCardsTable = this.shuffleCards()
        const shuffledPlayersTable = shuffledCardsTable.shufflePlayers();
        const handedOverTable = shuffledPlayersTable.handOverCards();
        return handedOverTable.drawCard()
    }

    shuffleCards() {
        const cardAggregate = this.cardAggregate.shuffle()
        return new TableBase(cardAggregate, this.playerAggregate, this.id);
    }

    shufflePlayers() {
        const playerAggregate = this.playerAggregate.shuffle()
        return new TableBase(this.cardAggregate, playerAggregate, this.id);
    }

    handOverCards() {
        const [newCardAggregate, newPlayerAggregate] = this.cardAggregate.handOverCards(this.playerAggregate);
        return new TableBase(newCardAggregate, newPlayerAggregate, this.id);
    }

    drawCard() {
        const [newCardAggregate, newPlayerAggregate] =  this.playerAggregate.drawCard(this.cardAggregate, this.turn);
        return new TableBase(newCardAggregate, newPlayerAggregate, this.id, this.turn);
    }

    discard(card: CardBase) {
        const newPlayerAggregate = this.playerAggregate.discard(card, this.turn);
        const newCardAggregate = this.cardAggregate.addDiscard(card);
        const turn = this.nextTurn();
        return new TableBase(newCardAggregate, newPlayerAggregate, this.id, turn)
    }

    protected nextTurn() {
        const turn = this.turn + 1
        if(this.playerAggregate.hasCompletedFullRound(turn)) return 0;
        return turn;
    }

    static createCards() {
        const suitsNum = 4
        const cards: CardBase[] = []

        for (let i = 0; i < suitsNum; i++) {
            for (let j = 1; j < 14; j++) {
                const card = new RegularCard(i, j);
                cards.push(card)
            }
        }

        for (let i = 1; i < 3; i++) {
            const joker = new JorkerCard(i)
            cards.push(joker)
        }

        return new CardAggregate(cards);
    }

    isMaxPlayersReached() {
        return this.maxPlayers == this.playerAggregate.currentPlayerCount;
    }

    static createTable(tableData: Table) {

        const cardData = tableData["cardAggregate"]["cards"];
        const discardData = tableData["cardAggregate"]["discards"];
        const playerData = tableData["playerAggregate"]["players"];
        const turn = tableData["turn"];
        const id = tableData["id"];

        const cards = cardData.map(card => {
            return card["type"] === 4 ? new JorkerCard(card["number"]) : new RegularCard(card["type"], card["number"])
        });
        const discards = discardData.map(card => card["type"] === 4 ? new JorkerCard(card["number"]) : new RegularCard(card["type"], card["number"]));
        const players = playerData.map(player => {
            const  playerCards= player["cards"].map(card => card["type"] === 4 ? new JorkerCard(card["number"]) : new RegularCard(card["type"], card["number"]));
            return new Player(player["id"], player["name"], playerCards);
        });

        const cardAggregate = new CardAggregate(cards, discards);
        const playerAggregate = new PlayerAggregate(players);

        return new TableBase(cardAggregate, playerAggregate, id, turn);
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
            turn: this.turn,
            id: this.id
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
    "turn": number,
    "id": string
}

export { TableBase, Table }