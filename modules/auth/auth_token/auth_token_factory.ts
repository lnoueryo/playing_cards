import { Session, TokenUser } from "./session";
import { JsonWebToken } from "./json_web_token";
import { CookieManager } from "../cookie_manager";
import http from 'http'
import { config } from "../../../main";


export class AuthTokenManagerFactory {

    static async create(user: TokenUser, sessionId: string, req: http.IncomingMessage, res: http.ServerResponse ) {
        const tableToken = process.env.TABLE_TOKEN
        if(!tableToken) throw new Error('TABLE_TOKEN is undefined')
        if(tableToken == 'session') return Session.createSession(user, sessionId, new CookieManager(req, res, config.sessionIdCookieKey))
        else if(tableToken == 'jwt') return JsonWebToken.createJsonWebToken(user, new CookieManager(req, res, config.tokenCookieKey))
        throw new Error('SESSION must be database or file')
    }
}
