import { CookieManager } from "../cookie_manager";
import { Session, User } from "./session";


interface AuthToken {
    id: any
    user?: any
    getUser(session: Session): any;
    saveToStorage(cm: CookieManager): void;
    deleteSession(): void;
    createAuthToken(id: string): Promise<AuthToken>;
    updateTableId(id: string): Promise<AuthToken>
    isYourTable(params: {[key: string]: string}): boolean
    hasTableId(): boolean
    hasTableId(): boolean
    hasUser(): boolean
    table_id: string;
    user_name: string;
    user_id: number;
}


class BaseAuthToken {

    readonly user: User

    constructor(user?: any) {
        this.user = user
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

    isYourTable(params: { [key: string]: string }) {
        return this.table_id == params.id
    }

    hasUser() {
        return !!this.user
    }

    hasTableId() {
        return !!this.table_id
    }

}

export { AuthToken, BaseAuthToken }