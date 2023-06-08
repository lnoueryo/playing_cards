import { AuthToken, BaseAuthToken, TokenUser } from "./base_auth_token";
import { CookieManager } from "../cookie_manager";
import jwt from 'jsonwebtoken';


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

    async updateTableId(id: string) {
        const user = JSON.parse(JSON.stringify(this.user));
        user['table_id'] = id
        const jwt = await JsonWebToken.createJsonWebToken(user, this.cm, this.secretKey)
        jwt.cm.setValueToCookie(jwt.id)
        return jwt
    }

    static async createAuthToken(id: string, cm: CookieManager, secretKey: string) {
        const user = await this.getUser(id, secretKey);
        if(!user) return;
        return new JsonWebToken(id, cm, user as TokenUser, secretKey);
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

    static async createJsonWebToken(user: TokenUser, cm: CookieManager, secretKey: string, expiresIn: string = '1h') {
        const id = jwt.sign(user, secretKey, { expiresIn })
        return new JsonWebToken(id, cm, user, secretKey);
    }

}

export { JsonWebToken }