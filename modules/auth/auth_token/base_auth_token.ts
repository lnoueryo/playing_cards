import { CookieManager } from "../cookie_manager";


interface AuthToken extends IBaseAuthToken {
    id: string
    saveToStorage(cm: CookieManager): void;
    deleteSession(): void
    endGame(): void;
    updateTableId(id: string): Promise<AuthToken>
}

interface IBaseAuthToken {
    user: TokenUser
    isYourTable(params: {[key: string]: string}): boolean
    hasTableId(): boolean
}

interface TokenUser {
    id: string
    user_id: number
    table_id: string
    name: string
    password: string
    email: string
    image: string
}


class BaseAuthToken implements IBaseAuthToken {

    readonly user: TokenUser

    constructor(user: TokenUser) {
        this.user = user
    }

    isYourTable(params: { [key: string]: string }) {
        return this.user.table_id == params.id
    }

    hasTableId() {
        return !!this.user.table_id
    }

}

export { AuthToken, BaseAuthToken, TokenUser }