import { Session } from '../auth_token';
import { SessionManager } from './session_manager';
import { Mysql } from '../../database/mysql';
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
        } catch (error) {
            console.warn(error)
            return null
        }
    }

    async createSession(session: Session) {

        const query = 'INSERT INTO sessions (`id`, `user_id`, `created_at`, `updated_at`) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)';
        const params = [session.id, session.user.user_id || session.user.id]
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

    async createTable(session: Session) {

        const query = 'UPDATE sessions SET table_id = ? WHERE id = ?';
        const params = [session.user.table_id, session.id]
        try {
            const results = await this.connection.query(query, params)
            if (results.affectedRows > 0) return session;
            return null;
        } catch (error) {
            console.warn(error)
            return null
        }
    }

    async updateTable(session: Session, table: Table) {

        const handler = async(connection: PoolConnection) => {
            const [count] = await connection.execute('SELECT COUNT(*) as count FROM sessions WHERE table_id = ? FOR UPDATE', [session.user.table_id]) as any
            console.log(count)
            if(count[0].count == 0) return count;
            if(count[0].count == table.maxPlayers) return count;
            const query = 'UPDATE sessions SET table_id = ? WHERE id = ?';
            console.log(session.user.table_id, session.id)
            const params = [session.user.table_id, session.id]
            const [results] = await connection.execute(query, params)
            return results
        }

        try {
            const results = await this.connection.transaction(handler)
            if (results.affectedRows > 0) return session;
            return null;
        } catch (error) {
            console.warn(error)
            return null
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
        } catch (error) {
            console.warn(error)
            return null
        }
    }

}