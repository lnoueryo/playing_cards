import { v4 as uuidv4 } from 'uuid';
import { SessionManager, SessionManagerFactory } from '../session_manager';
import { CookieManager } from '../cookie_manager';
import { AuthToken } from '..';

type User = {
    'id': number,
    'name': string,
    'email': string,
    'password': string,
    'table_id': string,
}


class Session implements AuthToken {

    protected readonly manager: SessionManager
    readonly user: User

    constructor(readonly id: string, readonly cm: CookieManager, user?: any) {
        this.manager = SessionManagerFactory.create()
        this.user = user;
    }

    async getUser() {
        return await this.manager.getUser(this)
    }

    async saveToStorage() {
        await this.manager.createSession(this)
        this.cm.setValueToCookie(this.id)
    }

    async deleteUser() {
        await this.manager.deleteUser(this)
        this.cm.expireCookie()
    }

    async updateTableId(id: string) {
        const user = JSON.parse(JSON.stringify(this.user));
        user['table_id'] = id
        const session = new Session(this.id, user)
        await this.manager.updateTableId(session)
        return session
    }

    async createAuthToken() {
        const user = await this.getUser();
        return new Session(this.id, this.cm, user);
    }

    static createSessionId(user: any, cm: CookieManager): Session {
        const id = uuidv4();
        return new Session(id, cm, user);
    }

    static async createSession(user: User, sessionId: string, cm: CookieManager) {
        return new Session(sessionId, cm, user);
    }

    get user_id() {
        return this.user.id;
    }

    get user_name() {
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

    isNotMatchingTableId(table_id: string) {
        return this.user.table_id != table_id;
    }

}

export { Session, User }
