

class Session {
    sessionId: string;
    data: any;

    constructor(sessionId: string, data: any) {
        this.sessionId = sessionId;
        this.data = data;
    }
}

export { Session }
