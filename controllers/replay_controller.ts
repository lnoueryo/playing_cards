import http from 'http';
import { TableRule } from "./utils";
import { AuthToken, SessionManagerFactory } from '../modules/auth';
import { config } from '../main';
import { DatabaseReplayManager } from '../models/table/table_manager/database_replay_manager';


class ReplayController extends TableRule {

    async index(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken) {

        try {

            this.httpResponse(res, 'replay-home.html')
        } catch (error) {
            console.error(error)
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Error: Not Found');
        }

        return session
    }

    async tables(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken, params: { [key: string]: string } = {id: ''}) {

        try {
            const cfg = await config;
            const tables = await cfg.DB.query(`
            SELECT
                tu.user_id,
                t.*,
                JSON_ARRAYAGG(JSON_OBJECT('id', u.id, 'name', u.name, 'image', u.image)) as players
            FROM
                tables_users tu
            LEFT JOIN
                tables t ON tu.table_id = t.id
            LEFT JOIN
                tables_users tu2 ON t.id = tu2.table_id
            LEFT JOIN
                users u ON tu2.user_id = u.id
            WHERE
                tu.user_id = ? AND tu2.user_id != ?
            GROUP BY
                t.id
            `, [Number(params.id), Number(params.id)])
            this.jsonResponse(res, tables)
        } catch (error) {
            console.error(error)
            return super.jsonResponse(res, {}, 500);
        } finally {
            return session
        }
    }

    async show(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken) {

        try {
            return this.httpResponse(res, 'replay.html')
        } catch (error) {
            console.error(error)
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Error: Not Found');
        }

        return session
    }

    async table(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken, params: { [key: string]: string } = {id: '', table_id: ''}) {

        try {
            const cfg = await config;
            const drm = await new DatabaseReplayManager(cfg.mongoReplay)
            const table = await drm.getUserTableJson({id: params.table_id})
            this.jsonResponse(res, table)
        } catch (error) {
            console.error(error)
            return super.jsonResponse(res, {}, 500);
        } finally {
            return session
        }
    }

}

export { ReplayController }