import { CookieManager } from "./cookie_manager";
import { User } from "./session";
import jwt from 'jsonwebtoken';


class JsonWebToken {

    protected readonly user: User

    constructor(protected readonly token: string, protected readonly secretKey, user?: User, protected readonly expiresIn = '1h') {}

    getUser() {
        try {
            const decoded = jwt.verify(this.token, this.secretKey);
            if (typeof decoded === 'string') return new JsonWebToken(this.token, JSON.parse(decoded));
            throw new Error('proper User type')
        } catch (error) {
            console.error('JWT Verification Error:', error);
            throw new Error('proper User type')
        }
    }

    saveToStorage(cm: CookieManager) {
        cm.setValueToCookie(this.token)
    }

    async deleteUser(cm: CookieManager) {
        cm.expireCookie()
    }

    async createAuthToken() {
        const user = await this.getUser();
        return new JsonWebToken(this.token, user);
    }

    static async createJsonWebToken(user: User, table_id: string, secretKey: string, expiresIn: string = '1h') {
        user['table_id'] = table_id
        const token = jwt.sign(user, secretKey, { expiresIn });
        return new JsonWebToken(token, secretKey), user;
    }

    joinTable(id: string) {
        this.user.table_id = id;
        // return new Session(this.id, this.user)
    }

    hasUser() {
        return !!this.user
    }

    hasTableId() {
        return !!this.user.table_id
    }

    deleteTableId() {
        const data = this.user;
        if(data && 'tableId' in data) data.tableId = '';
        // return new Session(this.id, data)
    }

    isNotMatchingTableId(table_id: string) {
        return this.user.table_id != table_id;
    }
}