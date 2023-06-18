import { Table } from "../../../models/table";
import { CookieManager } from "../cookie_manager";


interface AuthToken extends IBaseAuthToken {
    id: string
    saveToStorage(cm: CookieManager): void;
    deleteSession(): void
    endGame(): void;
    createTable(id: string): Promise<AuthToken>
    deleteTable(id: string): Promise<AuthToken>
}

interface IBaseAuthToken {
    user: TokenUser
    isYourTable(params: {[key: string]: string}): boolean
    hasTableId(): boolean
    responseUserJson(): any
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

    responseUserJson() {
        return {
            user_id: this.user.user_id,
            name: this.user.name,
            email: this.user.email,
            image: this.user.image,
        }
    }

}

export { AuthToken, BaseAuthToken, TokenUser }