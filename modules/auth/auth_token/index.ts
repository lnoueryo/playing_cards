import { Session, User } from './session'
import { JsonWebToken } from './json_web_token'
import { CookieManager } from '../cookie_manager';
import { AuthTokenManagerFactory } from './auth_token_factory';

interface AuthToken {
    id: any
    user?: any
    getUser(session: Session): any;
    saveToStorage(cm: CookieManager): void;
    deleteSession(): void;
    createAuthToken(id: string): Promise<AuthToken>;
    hasTableId(): boolean
    updateTableId(id: string): Promise<AuthToken>
    isNotMatchingTableId(id: string): boolean
    table_id: string;
    user_name: string;
    user_id: number;
}

export { Session, User, CookieManager, AuthToken, JsonWebToken, AuthTokenManagerFactory }