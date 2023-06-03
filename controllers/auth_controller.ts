import http from 'http';
import fs from 'fs';
import path from 'path';
import * as bcrypt from 'bcrypt';
import { Controller } from "./utils";
import { Session, User, CookieManager } from '../modules/auth';


class LoginController extends Controller {

    index(req: http.IncomingMessage, res: http.ServerResponse) {
        return super.httpResponse(res, 'login.html')
    }

    create(req: http.IncomingMessage, res: http.ServerResponse) {
        return super.httpResponse(res, 'login.html')
    }

    async user(req: http.IncomingMessage, res: http.ServerResponse, session: Session) {
        const user = session.user
        return super.jsonResponse(res, user);
    }

    async login(req: http.IncomingMessage, res: http.ServerResponse) {
        try {
            // リクエストのボディからemailとpasswordを取得
            const { email, password } = await super.getBody(req) as User;

            // ログイン情報をJSONファイルから取得
            const loginData = this.getLoginData();

            // ログイン情報の検証
            const user = loginData.find((user) => user.email === email);
            if (user && await this.comparePassword(password, user.password)) {
                // ログイン成功
                const session = Session.createSession(user)
                session.updateUser()
                const cm = new CookieManager(req, res, process.env.SESSION_ID_COOKIE_KEY)
                cm.setSessionIdToCookie(session)
                console.info('logged in')
                const response = { message: 'ログインに成功しました', user };
                return super.jsonResponse(res, response);
            } else {
              // ログイン失敗
              console.warn('failed to log in')
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

    async logout(req: http.IncomingMessage, res: http.ServerResponse, session: Session) {
        try {
            session.deleteUser()
            const cm = new CookieManager(req, res, process.env.SESSION_ID_COOKIE_KEY)
            cm.expireCookie()
            return super.jsonResponse(res, {});
        } catch (error) {
            // エラーハンドリング
            console.error('ログアウトエラー:', error);
            const response = { message: 'ログアウト中にエラーが発生しました' };
            return super.jsonResponse(res, response);
        }
    }

    protected getLoginData(): any[] {
        const rawData = fs.readFileSync(path.join(__dirname, '..', 'storage/login.json'), 'utf-8');
        return JSON.parse(rawData);
    }

    async hashPassword(password: string): Promise<string> {
        const saltRounds = 10; // ハッシュ化のコストパラメーター
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    }

    protected async comparePassword(password: string, passwordHash: string): Promise<boolean> {
        return await bcrypt.compare(password, passwordHash);
    }

}

export { LoginController }