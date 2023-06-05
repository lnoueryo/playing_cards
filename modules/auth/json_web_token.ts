import { config } from "../../main";
import { CookieManager } from "./cookie_manager";
import { User } from "./session";
import jwt from 'jsonwebtoken';
import http from 'http'


class JsonWebToken {

    protected readonly user: User
    protected readonly token: string

    constructor(protected readonly secretKey, protected readonly cm: CookieManager, protected readonly expiresIn = '1h') {
        this.user = this.getUser()
        this.token = cm.getCookieValue()
        if(!this.token) throw new Error('No token')
    }

    getUser(): User {
        try {
            const decoded = jwt.verify(this.token, this.secretKey);
            if (typeof decoded === 'string') return JSON.parse(decoded);
            throw new Error('proper User type')
        } catch (error) {
            console.error('JWT Verification Error:', error);
            throw new Error('proper User type')
        }
    }

    static async createJsonWebToken(user: User, table_id: string, secretKey: string, cm: CookieManager, expiresIn: string = '1h') {
        user['table_id'] = table_id
        const token = jwt.sign(user, secretKey, { expiresIn });
        return new JsonWebToken(secretKey, cm);
    }

    async deleteUser() {
        this.cm.expireCookie()
        // await this.manager.deleteUser(this)
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