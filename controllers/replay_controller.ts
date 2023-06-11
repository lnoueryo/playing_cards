import http from 'http';
import { TableRule } from "./utils";
import { AuthToken, SessionManagerFactory } from '../modules/auth';
import { config } from '../main';
import { TableManagerFactory } from '../models/table/table_manager/table_manager_factory';
import { Table } from '../models/table';
import { Player, PlayerAggregate } from '../models/player';
import { CardAggregate } from '../models/card';
import { AuthTokenManagerFactory } from '../modules/auth/auth_token';
import { DatabaseReplayManager } from '../models/table/table_manager/database_replay_manager';


class ReplayController extends TableRule {

    async index(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken) {

        return this.httpResponse(res, 'replay-home.html')
    }

    async tables(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken, params: { [key: string]: string } = {id: ''}) {
        const tables = await config.DB.query(`
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
        console.log(tables, 123456789)
        return this.jsonResponse(res, tables)
    }

    async show(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken) {

        return this.httpResponse(res, 'replay.html')
    }

    async table(req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken, params: { [key: string]: string } = {id: '', table_id: ''}) {
        const drm = await new DatabaseReplayManager(config.mongoReplay)
        const table = await drm.getUserTableJson({id: params.table_id})
        console.log(table)
        return this.jsonResponse(res, table)
    }

}

export { ReplayController }