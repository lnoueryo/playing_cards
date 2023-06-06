import { Session } from '../auth_token'
export abstract class SessionManager {
    abstract getUser(session: Session): any;
    abstract createSession(session: Session): any;
    abstract updateTableId(session: Session): any;
    abstract deleteUser(session: Session): any;
}