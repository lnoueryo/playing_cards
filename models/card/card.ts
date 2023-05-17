import { Model } from "../utils";


class CardBase implements Model {
    protected static nextId = 0;
    readonly id: number;
    readonly type;
    readonly number;
    constructor(type: string, number: number, id: number) {
        this.type = type;
        this.number = number;
        this.id = id;
        CardBase.nextId++;
    }
}

class RegularCard extends CardBase {
    constructor(type: string, number: number, id: number = CardBase.nextId) {
        super(type, number, id);
    }
}

class JorkerCard extends CardBase {
    constructor(type: string, id: number = CardBase.nextId) {
        super(type, -1, id);
    }
    get name() {
        return '';
    }
}

export {CardBase, RegularCard, JorkerCard}