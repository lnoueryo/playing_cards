import { Model } from "../utils";
class CardBase implements Model {
    protected static nextId = 0;
    protected _id: number;
    protected _type;
    protected _number;
    constructor(type: string, number: number) {
        this._type = type;
        this._number = number;
        this._id = CardBase.nextId;
        CardBase.nextId++;
    }
    get type() {
        return this._type;
    }
    get number() {
        return this._number;
    }
    get id() {
        return this._id;
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