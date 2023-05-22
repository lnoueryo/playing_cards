
type user = {
    'id': number,
    'name': string,
    'email': string,
    'password': string,
}
class Session {
    sessionId: string;
    data: user;

    constructor(sessionId: string, data: user) {
        this.sessionId = sessionId;
        this.data = data;
    }
}

export { Session }
