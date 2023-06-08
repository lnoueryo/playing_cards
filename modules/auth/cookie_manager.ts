import http from 'http'


class CookieManager {

    constructor(readonly request: http.IncomingMessage, readonly response: http.ServerResponse, readonly id: string) {}

    setValueToCookie(id: string): CookieManager {
        let date = new Date();
        date.setFullYear(date.getFullYear() + 10); // 10年後の日付を設定
        this.response.setHeader('Set-Cookie', `${this.id}=${id}; Path=/; Expires=${date.toUTCString()}; HttpOnly`);
        return new CookieManager(this.request, this.response, this.id)
    }

    getCookieValue() {
        const cookies = this.request.headers.cookie;
        if (!cookies) return '';

        const cookieString = cookies.split(';').find(c => c.trim().startsWith(this.id + '='));
        if (!cookieString) return '';

        const value = cookieString.split('=')[1];
        return value;
    }

    expireCookie() {
        // クッキーを削除するために、有効期限を過去に設定する
        this.response.setHeader('Set-Cookie', `${this.id}=deleted; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
        return new CookieManager(this.request, this.response, this.id)
    }

}


export { CookieManager }

