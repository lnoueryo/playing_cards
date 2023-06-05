import { Session } from '../session'
export abstract class SessionManager {
    abstract getUser(session: Session): any;
    abstract createSession(session: Session): any;
    abstract updateUser(session: Session): any;
    abstract deleteUser(session: Session): any;
}