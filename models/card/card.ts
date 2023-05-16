import { Model } from "../utils";


class CardBase implements Model {
    protected static nextId = 0;
    readonly id: number;
    readonly type;
    readonly number;
    constructor(type: string, number: number) {
        this.type = type;
        this.number = number;
        this.id = CardBase.nextId;
        CardBase.nextId++;
    }
}

class RegularCard extends CardBase {
    constructor(type: string, number: number) {
        super(type, number);
    }
}

class JorkerCard extends CardBase {
    constructor(type: string) {
        super(type, -1);
    }
    get name() {
        return '';
    }
}

export {CardBase, RegularCard, JorkerCard}