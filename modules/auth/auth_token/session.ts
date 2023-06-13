import { v4 as uuidv4 } from 'uuid';
import { SessionManager, SessionManagerFactory } from '../session_manager';
import { CookieManager } from '../cookie_manager';
import { AuthToken, BaseAuthToken, TokenUser } from './base_auth_token';
import { Table } from '../../../models/table';




class Session extends BaseAuthToken implements AuthToken {

    constructor(readonly id: string, readonly cm: CookieManager, user: TokenUser, readonly manager: SessionManager) {
        super(user)
    }

    async saveToStorage() {
        await this.manager.createSession(this)
        this.cm.setValueToCookie(this.id)
    }

    async deleteSession() {
        await this.manager.deleteSession(this)
        this.cm.expireCookie()
    }

    async endGame() {
        // 全てRDBでゲームを管理するならtable_id削除の処理を書く
    }

    async createTable(id: string) {
        const user = JSON.parse(JSON.stringify(this.user));
        user['table_id'] = id
        const session = new Session(this.id, this.cm, user, this.manager)
        return await this.manager.createTable(session)
    }

    async deleteTable() {
        return this.createTable('')
    }

    static async createAuthToken(id: string, cm: CookieManager, manager: SessionManager) {
        const user = await this.getUser(id, manager);
        if(!user) return;
        return new Session(id, cm, user, manager);
    }

    static async getUser(id: string, manager: SessionManager) {
        return await manager.getUser(id)
    }

    static createSessionId(user: any, cm: CookieManager, manager: SessionManager): Session {
        const id = uuidv4();
        return new Session(id, cm, user, manager);
    }

    static async createSession(user: TokenUser, sessionId: string, cm: CookieManager, manager: SessionManager) {
        return new Session(sessionId, cm, user, manager);
    }

}

export { Session, TokenUser }
