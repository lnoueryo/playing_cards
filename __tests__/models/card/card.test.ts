import { CardBase, RegularCard, JorkerCard, Card } from '../../../models/card/card';

describe('CardBase', () => {
    test('createCard should return correct RegularCard or JorkerCard', () => {
        const card: Card = {id: 0, type: 1, number: 5};
        const createdCard = CardBase.createCard(card);

        if(card.type === 4){
            expect(createdCard).toBeInstanceOf(JorkerCard);
        } else {
            expect(createdCard).toBeInstanceOf(RegularCard);
        }
    });

    test('convertToJson should return the correct JSON', () => {
        const card: Card = {id: 0, type: 1, number: 5};
        const createdCard = CardBase.createCard(card);
        const jsonCard = createdCard.convertToJson();

        expect(jsonCard.type).toBe(card.type);
        expect(jsonCard.number).toBe(card.number);
    });
});

describe('RegularCard', () => {
    test('should be correctly instantiated', () => {
        const type = 1;
        const number = 5;
        const id = type * 13 + number;
        const regularCard = new RegularCard(type, number);

        expect(regularCard.id).toBe(id);
        expect(regularCard.type).toBe(type);
        expect(regularCard.number).toBe(number);
    });
});

describe('JorkerCard', () => {
    test('should be correctly instantiated', () => {
        const number = 2;
        const type = 4;
        const id = type * 13 + number;
        const jorkerCard = new JorkerCard(number);

        expect(jorkerCard.id).toBe(id);
        expect(jorkerCard.type).toBe(type);
        expect(jorkerCard.number).toBe(number);
    });
});
