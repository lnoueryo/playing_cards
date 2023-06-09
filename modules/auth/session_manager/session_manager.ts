import { Table } from '../../../models/table';
import { Session } from '../auth_token'
export abstract class SessionManager {
    abstract getUser(id: string): any;
    abstract createSession(session: Session): any;
    abstract createTable(session: Session): any;
    abstract updateTable(session: Session, table: Table): any;
    abstract deleteSession(session: Session): any;
}