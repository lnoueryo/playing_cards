

class Ranking {

    readonly rank: number
    readonly highCard: number

    constructor(rank: number, highCard: number) {
        this.rank = rank;
        this.highCard = highCard;
    }

    isHandBetter(rank: number, cardNum: number) {
        return rank > this.rank  || (rank === this.rank && cardNum > this.highCard);
    }

    getRankName(lang: string) {
        return RankNameMap[this.rank][lang];
    }
}

const RankNameMap: Record<number, {[key: string]: string}> = {
    0: {jp: 'ノーペア', en: 'High Card'},
    1: {jp: 'ワンペア', en: 'One Pair'},
    2: {jp: 'ツーペア', en: 'Two Pairs'},
    3: {jp: 'スリーカード', en: 'Three of a Kind'},
    4: {jp: 'ストレート', en: 'Straight'},
    5: {jp: 'フラッシュ', en: 'Flush'},
    6: {jp: 'フルハウス', en: 'Full House'},
    7: {jp: 'フォーカード', en: 'Four of a Kind'},
    8: {jp: 'ストレートフラッシュ', en: 'Straight Flush'},
    9: {jp: 'ファイブカード', en: 'Five of a Kind'},
};

export { Ranking }