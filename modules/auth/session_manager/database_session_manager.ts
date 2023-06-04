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
        const query = 'SELECT * FROM users WHERE session = ?';
        const params = [session.id]
        try {
            const user = await this.connection.query(query, params)
            return user
        } catch (error) {
            console.warn(error)
            return {}
        }
    }

    async updateUser(session: Session) {
        const query = 'UPDATE users SET session = ? WHERE id = ?';
        const params = [session.id, session.userId]
        try {
            const user = await this.connection.query(query, params)
            return user
        } catch (error) {
            console.warn(error)
            return {}
        }
    }

    async deleteUser(session: Session) {
        const query = 'UPDATE users SET session = ? WHERE id = ?';
        const params = [null, session.userId]
        try {
            const user = await this.connection.query(query, params)
            return user
        } catch (error) {
            console.warn(error)
            return {}
        }
    }

}