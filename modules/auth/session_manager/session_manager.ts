import { Session } from '../auth_token'
export abstract class SessionManager {
    abstract getUser(id: string): any;
    abstract createSession(session: Session): any;
    abstract createTable(session: Session): any;
    abstract deleteSession(session: Session): any;
}