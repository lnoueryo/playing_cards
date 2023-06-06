import { config } from "../../../main";
import { CookieManager } from "../cookie_manager";
import { User } from "./session";
import jwt from 'jsonwebtoken';


class JsonWebToken {

    readonly secretKey: string
    constructor(readonly id: string, readonly cm: CookieManager, readonly user?: any, protected readonly expiresIn = '1h') {
        this.secretKey = config.secretKey
        this.id = id
    }

    getUser() {
        try {
            const decoded = jwt.verify(this.id, this.secretKey);
            if (typeof decoded !== 'object') {
                throw new Error('The payload of the token is expected to be an object.');
            }
            return decoded
        } catch (error) {
            console.error('JWT Verification Error:', error);
            return null
        }
    }

    saveToStorage() {
        this.cm.setValueToCookie(this.id)
    }

    async deleteSession() {
        this.cm.expireCookie()
    }

    async updateTableId(id: string) {
        const user = JSON.parse(JSON.stringify(this.user));
        user['table_id'] = id
        console.log(user['table_id'], 'table_id')
        const jwt = await JsonWebToken.createJsonWebToken(user, this.cm)
        jwt.cm.setValueToCookie(jwt.id)
        return jwt
    }

    async createAuthToken() {
        const user = await this.getUser();
        return new JsonWebToken(this.id, this.cm, user);
    }

    static async createJsonWebToken(user: User, cm: CookieManager, expiresIn: string = '1h') {
        const id = jwt.sign(user, config.secretKey, { expiresIn })
        return new JsonWebToken(id, cm, user);
    }
    get table_id() {
        return this.user.table_id
    }

    get user_name() {
        return this.user.name
    }

    get user_id() {
        return this.user.id
    }

    hasUser() {
        return !!this.user
    }

    hasTableId() {
        return !!this.user?.table_id
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

export { JsonWebToken }