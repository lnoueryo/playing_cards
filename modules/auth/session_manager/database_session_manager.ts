import { Session } from '../auth_token';
import { SessionManager } from './session_manager';
import { Mysql } from '../../middleware/mysql';
import { PoolConnection } from 'mysql2/promise';
import { Table } from '../../../models/table';


export class DatabaseSessionManager extends SessionManager {

    readonly connection: Mysql

    constructor(connection: Mysql) {
        super();
        this.connection = connection
    }

    async getUser(id: string) {

        const query = 'SELECT * FROM sessions s LEFT JOIN users u ON u.id = s.user_id WHERE s.id = ?';
        const params = [id]
        try {
            const user = await this.connection.query(query, params)
            if (user.length > 0) return user[0];
            return null;  // 見つからなかった場合
        } catch (error: any) {
            throw new Error(error)
        }
    }

    async createSession(session: Session) {

        const query = 'INSERT INTO sessions (`id`, `user_id`, `created_at`, `updated_at`) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)';
        const params = [session.id, session.user.user_id || session.user.id]
        try {
            const user = await this.connection.query(query, params)
            if (user.length > 0) return user[0];
            return null;
        } catch (error: any) {
            throw new Error(error)
        }
    }

    async createTable(session: Session) {

        const query = 'UPDATE sessions SET table_id = ? WHERE id = ?';
        const params = [session.user.table_id, session.id]
        try {
            const results = await this.connection.query(query, params)
            if (results.affectedRows > 0) return session;
            return null;
        } catch (error: any) {
            throw new Error(error)
        }
    }

    async deleteTable(session: Session) {
        return this.createTable(session)
    }

    async deleteSession(session: Session) {

        const query = 'DELETE FROM sessions WHERE id = ?';
        const params = [session.id]
        try {
            const user = await this.connection.query(query, params)
            if (user.length > 0) return user[0];
            return null;
        } catch (error: any) {
            console.error(`query: ${query} - params: ${params}`)
            throw new Error(error)
        }
    }

}