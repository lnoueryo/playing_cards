import { Session, User } from './session'
import { CookieManager } from './cookie_manager'
import { SessionManager, FileSessionManager, SessionManagerFactory } from './session_manager'
import { JsonWebToken } from './json_web_token'

interface AuthToken {
    id: any
    user?: any
    getUser(session: Session): any;
    saveToStorage(cm: CookieManager): void;
    deleteUser(): void;
    createAuthToken(id: string): Promise<AuthToken>;
    hasTableId(): boolean
    updateTableId(id: string): Promise<AuthToken>
    isNotMatchingTableId(id: string): boolean
    table_id: string;
    user_name: string;
    user_id: number;
}

export { Session, User, CookieManager, SessionManager, FileSessionManager, SessionManagerFactory, AuthToken, JsonWebToken }