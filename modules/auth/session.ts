
type User = {
    'id': number,
    'name': string,
    'email': string,
    'password': string,
    'tableId': string,
}

class Session {
    sessionId: string;
    data: User;

    constructor(sessionId: string, data: User) {
        this.sessionId = sessionId;
        this.data = data;
    }

    joinTable(id: string) {
        this.data.tableId = id;
        return new Session(this.sessionId, this.data)
    }

    get id() {
        return this.data.id;
    }

    get name() {
        return this.data.name;
    }

    get tableId() {
        return this.data.tableId;
    }

    hasTableId() {
        return !!this.tableId
    }

    deleteTableId() {
        const data = this.data;
        data['tableId'] = '';
        return new Session(this.sessionId, data)
    }

    isNotMatchingTableId(tableId: string) {
        return this.data.tableId != tableId;
    }

}

export { Session, User }
