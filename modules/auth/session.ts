import { v4 as uuidv4 } from 'uuid';
import { SessionManager, SessionManagerFactory } from './session_manager';

type User = {
    'id': number,
    'name': string,
    'email': string,
    'password': string,
    'tableId': string,
}

class Session {

    readonly manager: SessionManager
    readonly user: User
    constructor(readonly id: string, user?: User) {
        this.manager = SessionManagerFactory.create()
        this.user = user || this.getUser();
    }

    updateUser() {
        this.manager.updateUser(this)
    }

    deleteUser() {
        this.manager.deleteUser(this)
    }

    getUser(): User {
        return this.manager.getUser(this)
    }

    static createSession(user: any): Session {
        const id = uuidv4();
        return new Session(id, user);
    }

    joinTable(id: string) {
        this.user.tableId = id;
        return new Session(this.id, this.user)
    }

    get userId() {
        return this.user.id;
    }

    get userName() {
        return this.user.name;
    }

    get tableId() {
        return this.user?.tableId;
    }

    hasUser() {
        return !!this.user
    }

    hasTableId() {
        return !!this.tableId
    }

    deleteTableId() {
        const data = this.user;
        if(data && 'tableId' in data) {
            data.tableId = '';
        }
        return new Session(this.id, data)
    }

    isNotMatchingTableId(tableId: string) {
        return this.user.tableId != tableId;
    }

}

export { Session, User }
