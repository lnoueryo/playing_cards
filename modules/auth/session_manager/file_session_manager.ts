import fs from 'fs';
import { Session } from '../session';
import { SessionManager } from './session_manager';


export class FileSessionManager extends SessionManager {

    readonly SESSION_FILE_PATH: string;  // Change this in a real-world scenario.

    constructor() {
        super();
        if(!process.env.SESSION_FILE_PATH) {
            throw new Error('SESSION_FILE_PATH is not defined on .env')
        }
        this.SESSION_FILE_PATH = process.env.SESSION_FILE_PATH;
    }

    getUsers() {
        const usersStr = fs.readFileSync(this.SESSION_FILE_PATH, 'utf8');
        return JSON.parse(usersStr);
    }

    getUser(session: Session) {
        const users = this.getUsers();
        if(session.id in users == false) {
            console.warn('No user on session')
            return;
        }
        return users[session.id];
    }

    updateUser(session: Session) {
        const users = this.getUsers();
        users[session.id] = session.user;
        const data = JSON.stringify(users, null, 2);
        fs.writeFileSync(this.SESSION_FILE_PATH, data, 'utf8');
    }

    deleteUser(session: Session) {
        // JSONファイルからセッションデータを読み込む
        const users = this.getUsers();

        // セッションデータが存在すれば削除する
        if (users[session.id]) {
            delete users[session.id];

            // 更新したセッションデータをJSONファイルに保存する
            const data = JSON.stringify(users, null, 2);
            fs.writeFileSync(this.SESSION_FILE_PATH, data, 'utf8');
        }
    }

}