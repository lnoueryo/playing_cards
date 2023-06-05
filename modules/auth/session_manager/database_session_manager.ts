import fs from 'fs';
import { Session } from '../session';
import { SessionManager } from './session_manager';
import { Mysql } from '../../database/mysql';
import { config } from '../../../main';


export class DatabaseSessionManager extends SessionManager {

    readonly connection: Mysql

    constructor() {
        super();
        this.connection = config.DB
    }

    async getUser(session: Session) {

        const query = 'SELECT * FROM sessions s LEFT JOIN users u ON u.id = s.user_id WHERE s.id = ?';
        const params = [session.id]
        try {
            const user = await this.connection.query(query, params)
            if (user.length > 0) return user[0];
            return null;  // 見つからなかった場合
        } catch (error) {
            console.warn(error)
            return null
        }
    }

    async createSession(session: Session) {

        const query = 'INSERT INTO sessions (`id`, `user_id`, `created_at`, `updated_at`) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)';
        const params = [session.id, session.user_id]
        try {
            const user = await this.connection.query(query, params)
            console.debug(user, 'createSession')
            if (user.length > 0) return user[0];
            return null;
        } catch (error) {
            console.warn(error)
            return null
        }
    }

    async updateUser(session: Session) {

        const query = 'UPDATE sessions SET table_id = ? WHERE id = ?';
        const params = [session.table_id, session.id]
        try {
            const user = await this.connection.query(query, params)
            if (user.length > 0) return user[0];
            return null;
        } catch (error) {
            console.warn(error)
            return null
        }
    }

    async deleteUser(session: Session) {

        const query = 'DELETE FROM sessions WHERE id = ?';
        const params = [session.id]
        try {
            const user = await this.connection.query(query, params)
            if (user.length > 0) return user[0];
            return null;
        } catch (error) {
            console.warn(error)
            return null
        }
    }

}