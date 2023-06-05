import { v4 as uuidv4 } from 'uuid';
import { SessionManager, SessionManagerFactory } from './session_manager';

type User = {
    'id': number,
    'name': string,
    'email': string,
    'password': string,
    'table_id': string,
}


class Session {

    readonly manager: SessionManager
    readonly user: User
    constructor(readonly id: string, user?: any) {
        this.manager = SessionManagerFactory.create()
        this.user = user;
    }

    async createSession() {
        await this.manager.createSession(this)
    }

    async updateUser() {
        await this.manager.updateUser(this)
    }

    static async createSession(id: string) {
        const session = new Session(id);
        const user = await session.manager.getUser(session);
        return new Session(id, user);
    }

    async deleteUser() {
        await this.manager.deleteUser(this)
    }

    getUser(): User {
        return this.manager.getUser(this)
    }

    static createSessionId(user: any): Session {
        const id = uuidv4();
        return new Session(id, user);
    }

    joinTable(id: string) {
        this.user.table_id = id;
        return new Session(this.id, this.user)
    }

    get user_id() {
        return this.user.id;
    }

    get userName() {
        return this.user.name;
    }

    get table_id() {
        return this.user?.table_id;
    }

    hasUser() {
        return !!this.user
    }

    hasTableId() {
        return !!this.table_id
    }

    deleteTableId() {
        const data = this.user;
        if(data && 'table_id' in data) {
            data.table_id = '';
        }
        return new Session(this.id, data)
    }

    isNotMatchingTableId(table_id: string) {
        return this.user.table_id != table_id;
    }

}

export { Session, User }
