import { Cookie } from './cookie'
import { Session, User } from './session'
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import http from 'http';
import path from 'path';


class SessionManager {
    private static sessionsFilePath = path.join(__dirname, '..', '..', 'storage/sessions.json');
    private static cookieKey = 'sessionid';

    static createSession(data: any): Session {
        // セッションIDを生成
        const sessionId = uuidv4();
        return new Session(sessionId, data);
    }

    static getSession(sessionId: string): Session | null {
        // 既存のセッションデータを読み込む
        const sessions = this.readSessions();

        // 指定したIDのセッションデータを返す
        const data = sessions[sessionId];
        if (data) {
            return new Session(sessionId, data);
        } else {
            return null;
        }
    }

    static setCookie(res: http.ServerResponse, value: string): void {
        res.setHeader('Set-Cookie', `${this.cookieKey}=${value}; Path=/; HttpOnly`);
    }

    static getCookie(req: http.IncomingMessage): string | null {
        const cookies = req.headers.cookie;
        if (!cookies) return null;

        const cookieString = cookies.split(';').find(c => c.trim().startsWith(this.cookieKey + '='));
        if (!cookieString) return null;

        const value = cookieString.split('=')[1];
        return value;
    }

    private static readSessions(): {[key: string]: User} {
        let sessionJson: {[key: string]: User} = {};
        try {
            const data = fs.readFileSync(this.sessionsFilePath, 'utf8');
            sessionJson = JSON.parse(data);
        } catch (error) {
            console.error(`Failed to read sessions file: ${error}`);
        }
        return sessionJson;
    }

    static writeSessions(session: Session): void {
        try {
            const sessions = this.readSessions();
            sessions[session.sessionId] = session.data;
            const data = JSON.stringify(sessions, null, 2);
            fs.writeFileSync(this.sessionsFilePath, data, 'utf8');
        } catch (error) {
            console.error(`Failed to write sessions file: ${error}`);
        }
    }

    static authorize(req: http.IncomingMessage): Session | undefined {
        const value = this.getCookie(req);
        if(!value) return;
        const session = this.getSession(value);
        if(!session) return;

        return session;
    }
}


export { SessionManager }