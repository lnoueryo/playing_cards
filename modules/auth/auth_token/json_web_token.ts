import { AuthToken, BaseAuthToken, TokenUser } from "./base_auth_token";
import { config } from "../../../main";
import { CookieManager } from "../cookie_manager";
import jwt from 'jsonwebtoken';
require('dotenv').config();

const SECRET_KEY = process.env.SECRET_KEY || ''

class JsonWebToken extends BaseAuthToken implements AuthToken {

    readonly secretKey: string
    constructor(readonly id: string, readonly cm: CookieManager, user: any, protected readonly expiresIn = '1h') {
        super(user)
        this.secretKey = SECRET_KEY
        this.id = id
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
        const jwt = await JsonWebToken.createJsonWebToken(user, this.cm)
        jwt.cm.setValueToCookie(jwt.id)
        return jwt
    }

    static async createAuthToken(id: string, cm: CookieManager) {
        const user = await this.getUser(id, SECRET_KEY);
        return new JsonWebToken(id, cm, user);
    }

    static getUser(id: string, secretKey: string) {
        try {
            const decoded = jwt.verify(id, secretKey);
            if (typeof decoded !== 'object') {
                throw new Error('The payload of the token is expected to be an object.');
            }
            return decoded
        } catch (error) {
            console.error('JWT Verification Error:', error);
            return null
        }
    }

    static async createJsonWebToken(user: TokenUser, cm: CookieManager, expiresIn: string = '1h') {

        const id = jwt.sign(user, SECRET_KEY, { expiresIn })
        return new JsonWebToken(id, cm, user);
    }

}

export { JsonWebToken }