import http from 'http';
import { Controller } from "./utils";
import { Session, CookieManager, AuthToken } from '../modules/auth';
import { User } from '../models/database';
import { config } from '../main';


class LoginController extends Controller {

    index(req: http.IncomingMessage, res: http.ServerResponse) {

        return super.httpResponse(res, 'login.html')
    }

    async create(req: http.IncomingMessage, res: http.ServerResponse) {

        const { name, password, email, image } = await this.getBody(req) as {name: string, password: string, email: string, image: string}
        await User.create(name, password, email, image)
        return super.jsonResponse(res, {})
    }

    async session(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken) {

        const user = session.user
        return super.jsonResponse(res, user);
    }

    async token(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken) {

        const user = session.user
        return super.jsonResponse(res, user);
    }

    async login(req: http.IncomingMessage, res: http.ServerResponse) {

        try {
            // リクエストのボディからemailとpasswordを取得
            const { email, password } = await this.getBody(req) as {email: string, password: string};
            const user = await User.findByEmail(email)

            if (user && await user.isPasswordCorrect(password)) {
                const session = Session.createSessionId(user, new CookieManager(req, res, config.server.SESSION_ID_COOKIE_KEY))
                await session.saveToStorage()
                const response = { message: 'ログインに成功しました', user };
                return super.jsonResponse(res, response);
            }

            console.warn('failed to log in')
            const response = { message: 'ログインに失敗しました' };
            return super.jsonResponse(res, response, 401);

        } catch (error) {
            console.error('ログインエラー:', error);
            const response = { message: 'ログイン処理中にエラーが発生しました' };
            return super.jsonResponse(res, response);
        }
    }

    async logout(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken) {

        try {
            await session.deleteSession()
            return super.jsonResponse(res, {});
        } catch (error) {
            console.error('ログアウトエラー:', error);
            const response = { message: 'ログアウト中にエラーが発生しました' };
            return super.jsonResponse(res, response);
        }
    }

}

export { LoginController }