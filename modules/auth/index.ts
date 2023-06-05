import { Session, User } from './session'
import { CookieManager } from './cookie_manager'
import { SessionManager, FileSessionManager, SessionManagerFactory } from './session_manager'

interface AuthToken {
    getUser(session: Session): any;
    saveToStorage(cm: CookieManager): void;
    deleteUser(cm: CookieManager): void;
    createAuthToken(id: string): Promise<AuthToken>;
}

export { Session, User, CookieManager, SessionManager, FileSessionManager, SessionManagerFactory, AuthToken }