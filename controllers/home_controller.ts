import http from 'http';
import { Controller } from "./utils";
import { Session } from '../modules/auth';
import { config } from '../main';
import { TableManagerFactory } from '../models/table/table_manager/table_manager_factory';


class HomeController extends Controller {

    async index(req: http.IncomingMessage, res: http.ServerResponse, session: Session) {
        const tm = TableManagerFactory.create()
        const tablesJson = await tm.getTablesJson()
        if(session.table_id && tm.tableNotExists(session.table_id, tablesJson)) {
            session = session.deleteTableId()
            await session.updateUser()
        }
        if(session.hasTableId() && tm.isPlaying(session, tablesJson)) return config.server.redirect(res, `/table/${session.table_id}`)
        return super.httpResponse(res, 'index.html')
    }

    async tables(req: http.IncomingMessage, res: http.ServerResponse) {
        const tm = TableManagerFactory.create()
        const tableJson = await tm.getTablesJson()
        const tables = tm.toTables(tableJson)
        return super.jsonResponse(res, tables)
    }
}

export { HomeController }