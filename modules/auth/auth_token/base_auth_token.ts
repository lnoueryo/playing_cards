import { CookieManager } from "../cookie_manager";
import { Session } from "./session";


interface AuthToken extends IBaseAuthToken {
    id: string
    getUser(session: Session): any;
    saveToStorage(cm: CookieManager): void;
    deleteSession(): void;
    createAuthToken(id: string): Promise<AuthToken>;
    updateTableId(id: string): Promise<AuthToken>
}

interface IBaseAuthToken {
    user: any
    isYourTable(params: {[key: string]: string}): boolean
    hasTableId(): boolean
    hasUser(): boolean
}

interface TokenUser {
    id: string
    user_id: number
    table_id: string | undefined
    name: string
    password: string
    email: string
    image: string
}


class BaseAuthToken implements IBaseAuthToken {

    readonly user: TokenUser

    constructor(user?: any) {
        this.user = user
    }

    isYourTable(params: { [key: string]: string }) {
        return this.user?.table_id == params.id
    }

    hasUser() {
        return !!this.user
    }

    hasTableId() {
        return !!this.user?.table_id
    }

    get user_id() {
        return this.user.user_id;
    }

}

export { AuthToken, BaseAuthToken, TokenUser }