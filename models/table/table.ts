import { Model } from "../utils";
import { CardBase, RegularCard, JorkerCard, CardAggregate } from '../card'
import { Player, PlayerAggregate } from '../player';


class TableBase implements Model {

    readonly cardAggregate;
    readonly playerAggregate;
    readonly turn;
    protected static nextId = 0;
    readonly id: number;

    constructor(cardAggregate: CardAggregate, playerAggregate: PlayerAggregate, id: number = TableBase.nextId, turn: number = 0) {
        this.cardAggregate = cardAggregate;
        this.playerAggregate = playerAggregate;
        this.turn = turn;
        this.id = id;
        TableBase.nextId++;
    }

    addPlayer(player: Player) {
        const newPlayerAggregate = this.playerAggregate.addPlayer(player);
        return new TableBase(this.cardAggregate, newPlayerAggregate, this.id);
    }

    shuffle() {
        const newCardAggregate = this.cardAggregate.shuffle()

        return new TableBase(newCardAggregate, this.playerAggregate, this.id);
    }

    handOverCards() {
        const [newCardAggregate, newPlayerAggregate] = this.cardAggregate.handOverCards(this.playerAggregate);
        return new TableBase(newCardAggregate, newPlayerAggregate, this.id);
    }

    drawCard() {
        console.log(this.turn)
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

    static createCards() {
        const suits = ['clover', 'spade', 'heart', 'diamond']
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

    static createTable(tableData: Table) {

        const cardData = tableData["cardAggregate"]["cards"];
        const discardData = tableData["cardAggregate"]["discards"];
        const playerData = tableData["playerAggregate"]["players"];
        const turn = tableData["turn"];
        const id = tableData["id"];

        const cards = cardData.map(card => card["type"] === "joker" ? new JorkerCard(card["type"], card["id"]) : new RegularCard(card["type"], card["number"], card["id"]));
        const discards = discardData.map(card => card["type"] === "joker" ? new JorkerCard(card["type"], card["id"]) : new RegularCard(card["type"], card["number"], card["id"]));
        const players = playerData.map(player => {
            const  playerCards= player["cards"].map(card => card["type"] === "joker" ? new JorkerCard(card["type"], card["id"]) : new RegularCard(card["type"], card["number"], card["id"]));
            return new Player(player["id"], player["name"], playerCards);
        });

        const cardAggregate = new CardAggregate(cards, discards);
        const playerAggregate = new PlayerAggregate(players);

        return new TableBase(cardAggregate, playerAggregate, id, turn);
    }

}

interface Table {
    "cardAggregate": {
        "cards": [
            {
                "type": string,
                "number": number,
                "id": number
            },
        ],
        "discards": [
            {
                "type": string,
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
                        "type": string,
                        "number": number,
                        "id": number
                    },
                ]
            }
        ]
    },
    "turn": number,
    "id": number
}

export { TableBase, Table }