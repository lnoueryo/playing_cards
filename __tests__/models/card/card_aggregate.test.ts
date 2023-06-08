import { CardAggregate, RegularCard, JorkerCard } from "../../../models/card";
import { Player } from "../../../models/player";
import { PlayerAggregate } from "../../../models/player/player_aggregate";

describe("CardAggregate", () => {
    it("should create a new card set", () => {
        const cardAggregate = CardAggregate.createNewCards();
        expect(cardAggregate.cards.length).toBe(54); // 52 regular cards + 4 jokers
        expect(cardAggregate.discards.length).toBe(0);
    });

    it("should create a card set from JSON", () => {
        const cardsJson = [
            { id: 0, type: 0, number: 1 },
            { id: 1, type: 0, number: 2 },
            { id: 2, type: 0, number: 3 },
        ];
        const discardsJson = [
            { id: 3, type: 1, number: 1 },
        ];
        const cardAggregate = CardAggregate.createCards(cardsJson, discardsJson);
        expect(cardAggregate.cards.length).toBe(3);
        expect(cardAggregate.discards.length).toBe(1);
    });

    it("should shuffle the card set", () => {
        const cardAggregate = CardAggregate.createNewCards();
        const shuffledCardAggregate = cardAggregate.shuffle();
        const ids = shuffledCardAggregate.cards.map(card => card.id);
        // Check if the IDs are in ascending order
        const isSorted = ids.every((value, index, array) => index === 0 || array[index - 1] <= value);
        // If the array is not sorted, then the cards were shuffled
        expect(isSorted).toBeFalsy()
        // We can't really check the order since it's random, but we can at least check the counts
        expect(shuffledCardAggregate.cards.length).toBe(54);
    });

    it("should hand over cards", () => {
        const cardAggregate = CardAggregate.createNewCards();
        const player1 = new Player(1, 'test_user1')
        const player2 = new Player(2, 'test_user2')
        const playerAggregate = new PlayerAggregate([player1, player2]);
        const [newCardAggregate, newPlayerAggregate] = cardAggregate.handOverCards(playerAggregate);
        expect(newCardAggregate.cards.length).toBe(44); // 5 cards handed over to each player
        newPlayerAggregate.players.forEach(player => {
            expect(player.hand.cards.length).toBe(5);
        })
        // expect(newPlayerAggregate.players.cards.length).toBe(5);
    });

    it("should get cards", () => {
        const cardAggregate = CardAggregate.createNewCards();
        const shuffledCardAggregate = cardAggregate.shuffle();
        const threeCardsFromTop = shuffledCardAggregate.cards.slice(0, 3)
        const cards = shuffledCardAggregate.getCardsFromDeck(3)
        const ids1 = cards.map(card => card.id);
        const ids2 = threeCardsFromTop.map(card => card.id);

        // Check if every element at each index are same for both arrays
        const isSameOrder = ids1.every((id, index) => id === ids2[index]);
        expect(isSameOrder).toBeTruthy();
    });

    it("should add a card to the discard pile", () => {
        const cardAggregate = CardAggregate.createNewCards();
        const card = new RegularCard(0, 1);
        const newCardAggregate = cardAggregate.addDiscard(card);
        expect(newCardAggregate.discards.length).toBe(1);
    });
});
