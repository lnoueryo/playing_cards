import { Session, TokenUser } from "./session";
import { JsonWebToken } from "./json_web_token";
import { CookieManager } from "../cookie_manager";
import http from 'http'
import { config } from "../../../main";
import { SessionManager } from "../session_manager";


class AuthTokenManagerFactory {

    static async create(user: TokenUser, sessionId: string, req: http.IncomingMessage, res: http.ServerResponse, tableToken: string, manager: SessionManager, secretKey: string ) {
        if(!tableToken) throw new Error('TABLE_TOKEN is undefined')
        if(tableToken == 'session') return Session.createSession(user, sessionId, new CookieManager(req, res, config.sessionIdCookieKey), manager)
        else if(tableToken == 'jwt') return JsonWebToken.createJsonWebToken(user, new CookieManager(req, res, config.tokenCookieKey), secretKey)
        throw new Error('SESSION must be database or file')
    }
}

export { AuthTokenManagerFactory }