import { RegularCard, JorkerCard, CardBase } from './models/card'
import { Table } from './models/table'
import { Player } from './models/player'

const cards = Table.createCards();

const playerNames = ['Rio', 'Ryl', 'Akira']
const players: Player[] = []

for (let i = 0; i < playerNames.length; i++) {
    const player = new Player(playerNames[i]);
    players.push(player)
}

const shogo = new Player('shogo')


const table = new Table(cards, players).shuffle()
const newTable = table.addPlayer(shogo)
const handedOverTable = newTable.handOverCards()
handedOverTable.displayPlayers()
const drawTable = handedOverTable.drawCard()
drawTable.displayPlayers()
const discardCard = drawTable.discard(drawTable.players[0].cards[0])
discardCard.displayPlayers()
// console.log()