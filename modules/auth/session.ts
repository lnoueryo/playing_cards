
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

    hasTableId() {
        return !!this.data.tableId
    }

}

export { Session, User }
