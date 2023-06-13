import http from 'http';
import { Controller } from "./utils";
import { Session, CookieManager, AuthToken, SessionManagerFactory } from '../modules/auth';
import { User } from '../models/database';
import { config } from '../main';


class LoginController extends Controller {

    index(req: http.IncomingMessage, res: http.ServerResponse) {
        try {

            return super.httpResponse(res, 'login.html')
        } catch (error) {
            console.error(error)
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Error: Not Found');
        }
    }

    async create(req: http.IncomingMessage, res: http.ServerResponse) {

        const { name, password, email, image } = await this.getBody(req) as {name: string, password: string, email: string, image: string}
        await User.create(name, password, email, image)
        return super.jsonResponse(res, {})
    }

    async session(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken) {

        const user = session.user
        super.jsonResponse(res, user);
        return session
    }

    async token(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken) {

        const user = session.user
        super.jsonResponse(res, user);
        return session
    }

    async login(req: http.IncomingMessage, res: http.ServerResponse) {

        const cfg = await config;
        // リクエストのボディからemailとpasswordを取得
        const { email, password } = await this.getBody(req) as {email: string, password: string};
        const user = await User.findByEmail(email)

        if (user && await user.isPasswordCorrect(password)) {
            const session = Session.createSessionId(user, new CookieManager(req, res, cfg.server.SESSION_ID_COOKIE_KEY), SessionManagerFactory.create(cfg.sessionManagement, cfg.DB))
            await session.saveToStorage()
            return super.jsonResponse(res, { message: 'ログインに成功しました', user });
        }

        if(!user) {
            console.warn(`${new Date().toISOString()} - Authentication: ${req.method} 401 ${req.url} from ${req.headers['x-forwarded-for'] || req.socket.remoteAddress} - Message: Not Found The Email - User Agent: ${req.headers['user-agent']} - Referrer: ${req.headers.referer}`)
            return super.jsonResponse(res, { message: 'ログインに失敗しました' }, 401);
        }

        console.warn(`${new Date().toISOString()} - Authentication: ${req.method} 401 ${req.url} from ${req.headers['x-forwarded-for'] || req.socket.remoteAddress} - Message: Password Is Wrong - User Agent: ${req.headers['user-agent']} - Referrer: ${req.headers.referer}`)
        return super.jsonResponse(res, { message: 'ログインに失敗しました' }, 401);
    }

    async logout(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken) {

        await session.deleteSession()
        super.jsonResponse(res, {});
        return session
    }

}

export { LoginController }