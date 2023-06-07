import { v4 as uuidv4 } from 'uuid';
import { SessionManager, SessionManagerFactory } from '../session_manager';
import { CookieManager } from '../cookie_manager';
import { AuthToken, BaseAuthToken } from './base_auth_token';

type User = {
    'id': number,
    'name': string,
    'email': string,
    'password': string,
    'table_id': string,
}


class Session extends BaseAuthToken implements AuthToken {

    protected readonly manager: SessionManager
    readonly user: User

    constructor(readonly id: string, readonly cm: CookieManager, user?: any) {
        super(user)
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

    async deleteSession() {
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

}

export { Session, User }
