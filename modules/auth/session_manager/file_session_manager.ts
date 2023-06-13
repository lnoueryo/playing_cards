import fs from 'fs';
import { Session } from '../auth_token';
import { SessionManager } from './session_manager';
import { Table } from '../../../models/table';


export class FileSessionManager extends SessionManager {

    readonly SESSION_FILE_PATH: string;  // Change this in a real-world scenario.

    constructor() {
        super();
        if(!process.env.SESSION_FILE_PATH) {
            throw new Error('SESSION_FILE_PATH is not defined on .env')
        }
        this.SESSION_FILE_PATH = process.env.SESSION_FILE_PATH;
    }

    async getUsers() {
        const usersStr = await fs.readFileSync(this.SESSION_FILE_PATH, 'utf8');
        return JSON.parse(usersStr);
    }

    async getUser(id: string) {
        const users = await this.getUsers();
        if(id in users == false) return;
        return users[id];
    }

    createSession(session: Session) {
        return this.createTable(session)
    }

    async createTable(session: Session) {
        const users = await this.getUsers();
        users[session.id] = session.user;
        const data = JSON.stringify(users, null, 2);
        await fs.writeFileSync(this.SESSION_FILE_PATH, data, 'utf8');
        return users
    }


    async deleteTable(session: Session) {
        return this.createTable(session)
    }

    async deleteSession(session: Session) {
        // JSONファイルからセッションデータを読み込む
        const users = await this.getUsers();

        // セッションデータが存在すれば削除する
        if (users[session.id]) {
            delete users[session.id];

            // 更新したセッションデータをJSONファイルに保存する
            const data = JSON.stringify(users, null, 2);
            fs.writeFileSync(this.SESSION_FILE_PATH, data, 'utf8');
        }
    }

}