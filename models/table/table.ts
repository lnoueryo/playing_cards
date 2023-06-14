import { Model } from "../utils";
import { CardBase, CardAggregate } from '../card'
import { Player, PlayerAggregate } from '../player';
import { v4 as uuidv4 } from 'uuid';
import { AuthToken } from "../../modules/auth";
import { Mysql } from "../../modules/middleware/mysql";

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
    protected createdAt = new Date()

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

    hideCards(id: number) {
        const playerAggregate = this.playerAggregate.hideCards(id)
        return new Table(this.cardAggregate, playerAggregate, this.maxPlayers, this.maxRounds, this.maxGames, this.id, this.game, this.round, this.turn)
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

    async createTable(DB: Mysql,session: AuthToken) {
        const handler = async(connection: any) => {
            const result = await connection.query('INSERT INTO tables (id, max_players, max_rounds, max_games) VALUES (?, ?, ?, ?)', [this.id, this.maxPlayers, this.maxRounds, this.maxGames]) as any;
            const _result = await connection.query('INSERT INTO tables_users (table_id, user_id) VALUES (?, ?)', [this.id, session.user.user_id]);
            return _result
        }
        await DB.transaction(handler)
    }

    async updatePlayer(DB: Mysql, session: AuthToken) {
        const handler = async(connection: any) => {
            const [count] = await connection.execute('SELECT COUNT(*) as count FROM tables_users WHERE table_id = ? FOR UPDATE', [this.id]) as any
            if(count[0].count == 0) return count;
            if(count[0].count == this.maxPlayers) return count;
            let result = await connection.query('INSERT INTO tables_users (table_id, user_id) VALUES (?, ?)', [this.id, session.user.user_id]);
            if(this.isMaxPlayersReached()) result = await connection.query('UPDATE tables SET start = 1 WHERE id = ?', [this.id])
            return result
        }
        await DB.transaction(handler)
    }

    async deleteTable(DB: Mysql, user_ids: number[]) {
        const handler = async(connection: any) => {
            const placeholders = user_ids.map(() => "?").join(",");
            const tablesUsersParams = [this.id, ...user_ids]
            const tablesParams = [this.id]
            const [tablesData] = await connection.execute(
                'SELECT tu.*, t.start, t.active as table_active FROM tables_users tu LEFT JOIN tables t ON tu.table_id = t.id WHERE tu.table_id = ? AND tu.active = 1 FOR UPDATE',
                tablesParams
            );

            if (tablesData[0].start) {
                await connection.execute(`UPDATE tables_users SET active = false WHERE table_id = ? AND user_id IN (${placeholders})`, tablesUsersParams);
                if (tablesData.length === 1) {
                    await connection.execute('UPDATE tables SET active = false WHERE id = ?', tablesParams);
                }
            } else {
                await connection.execute(`DELETE FROM tables_users WHERE table_id = ? AND user_id IN (${placeholders})`, tablesUsersParams);
                if (tablesData.length === 1) await connection.execute('DELETE FROM tables WHERE id = ?', tablesParams);
            }

            return this
        }
        await DB.transaction(handler)
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
                }[],
                "ranking": {
                    "rank": number,
                    "highCard": number
                }
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