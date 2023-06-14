import { AuthToken, BaseAuthToken, TokenUser } from "./base_auth_token";
import { CookieManager } from "../cookie_manager";
import jwt from 'jsonwebtoken';
import { Table } from "../../../models/table";


class JsonWebToken extends BaseAuthToken implements AuthToken {

    readonly secretKey: string
    constructor(readonly id: string, readonly cm: CookieManager, user: TokenUser, secretKey: string, protected readonly expiresIn = '1h') {
        super(user)
        this.secretKey = secretKey
        this.id = id
    }

    saveToStorage() {
        this.cm.setValueToCookie(this.id)
    }

    async deleteSession() {
        this.cm.expireCookie()
    }

    async endGame() {
        this.deleteSession()
    }

    async createTable(id: string) {
        const user = JSON.parse(JSON.stringify(this.user));
        user['table_id'] = id
        const jwt = await JsonWebToken.createJsonWebToken(user, this.cm, this.secretKey)
        jwt.cm.setValueToCookie(jwt.id)
        return jwt
    }

    async deleteTable(id: string) {
        const user = JSON.parse(JSON.stringify(this.user));
        user['table_id'] = id
        const jwt = await JsonWebToken.createJsonWebToken(user, this.cm, this.secretKey)
        jwt.cm.setValueToCookie(jwt.id)
        return jwt
    }

    static async createAuthToken(id: string, cm: CookieManager, secretKey: string) {
        const user = await this.getUser(id, secretKey);
        if(!user) {
            cm.expireCookie();
            return;
        }
        return new JsonWebToken(id, cm, user as TokenUser, secretKey);
    }

    static getUser(id: string, secretKey: string) {
        try {
            const decoded = jwt.verify(id, secretKey);
            if (typeof decoded !== 'object') {
                console.warn(`invalid token: ${id}`)
                return
            };
            return decoded
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                console.warn('Token expired!')
            } else if (error instanceof jwt.JsonWebTokenError) {
                console.warn('Invalid token!')
            } else {
                console.error(error);
            }
            return;
        }
    }

    static async createJsonWebToken(user: TokenUser, cm: CookieManager, secretKey: string, expiresIn: string = '1h') {
        const id = jwt.sign(user, secretKey, { expiresIn })
        return new JsonWebToken(id, cm, user, secretKey);
    }

}

export { JsonWebToken }