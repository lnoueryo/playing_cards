import http from 'http';
import { Controller } from "./utils";
import { SessionManager } from '../modules/auth';
import { Session } from '../modules/auth/session';


class LoginController extends Controller {

    index(req: http.IncomingMessage, res: http.ServerResponse) {
        return super.httpResponse(res, 'login.html')
    }

    create(req: http.IncomingMessage, res: http.ServerResponse) {
        return super.httpResponse(res, 'login.html')
    }

    async user(req: http.IncomingMessage, res: http.ServerResponse, session: Session) {
        const user = session.data
        return super.jsonResponse(res, user);
    }

    async login(req: http.IncomingMessage, res: http.ServerResponse) {
        try {
            // リクエストのボディからemailとpasswordを取得
            const body = await super.getBody(req);
            const { email, password } = JSON.parse(body);

            // ログイン情報をJSONファイルから取得
            const loginData = super.getLoginData();

            // ログイン情報の検証
            const user = loginData.find((user) => user.email === email);
            if (user && await super.comparePassword(password, user.password)) {
                // ログイン成功
                const session = SessionManager.createSession(user)
                SessionManager.writeSessions(session)
                SessionManager.setCookie(res, session.sessionId)
                const response = { message: 'ログインに成功しました', user };
                return super.jsonResponse(res, response);
            } else {
              // ログイン失敗
              const response = { message: 'ログインに失敗しました' };
              return super.jsonResponse(res, response, 401);
            }
        } catch (error) {
            // エラーハンドリング
            console.error('ログインエラー:', error);
            const response = { message: 'ログイン処理中にエラーが発生しました' };
            return super.jsonResponse(res, response);
        }
    }
}

export { LoginController }