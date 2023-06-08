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
    hasUser(): boolean
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

    constructor(user: any) {
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

}

export { AuthToken, BaseAuthToken, TokenUser }