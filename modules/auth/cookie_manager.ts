import http from 'http'
import { Session } from './session';


class CookieManager {

    constructor(private request: http.IncomingMessage, private response: http.ServerResponse, readonly id?: string) {
        if(!this.id) throw new Error('No cookie key')
    }

    setSessionIdToCookie(session: Session): void {
        let date = new Date();
        date.setFullYear(date.getFullYear() + 10); // 10年後の日付を設定
        this.response.setHeader('Set-Cookie', `${this.id}=${session.id}; Path=/; Expires=${date.toUTCString()}; HttpOnly`);
    }

    getSessionId(): string | undefined {
        const cookies = this.request.headers.cookie;
        if (!cookies) return;

        const cookieString = cookies.split(';').find(c => c.trim().startsWith(this.id + '='));
        if (!cookieString) return;

        const value = cookieString.split('=')[1];
        return value;
    }

    expireCookie() {
        // クッキーを削除するために、有効期限を過去に設定する
        this.response.setHeader('Set-Cookie', `${this.id}=deleted; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
    }

}


export { CookieManager }

