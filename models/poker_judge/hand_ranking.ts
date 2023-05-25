

class HandRanking {

    readonly rank: number
    readonly highCard: number

    constructor(rank: number, highCard: number) {
        this.rank = rank;
        this.highCard = highCard;
    }
}

const RankNameMap: Record<number, string> = {
    0: 'High Card',
    1: 'One Pair',
    2: 'Two Pairs',
    3: 'Three of a Kind',
    4: 'Straight',
    5: 'Flush',
    6: 'Full House',
    7: 'Four of a Kind',
    8: 'Straight Flush',
    9: 'Five of a Kind'
};

export { HandRanking }