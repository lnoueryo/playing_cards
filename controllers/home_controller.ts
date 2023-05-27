import http from 'http';
import { Player, PlayerAggregate } from "../models/player";
import { TableBase, TableManager } from "../models/table";
import { Controller } from "./utils";
import { Session } from '../modules/auth/session';
import { server } from '../main';
import { SessionManager } from '../modules/auth';
import { CardAggregate } from '../models/card';
import { Table } from '../models/table/table';


class HomeController extends Controller {

    async index(req: http.IncomingMessage, res: http.ServerResponse, session: Session) {
        const tablesJson = await TableManager.readJsonFile()
        if(TableManager.tableNotExists(session.tableId, tablesJson)) {
            session = session.deleteTableId()
            SessionManager.writeSessions(session)
        }
        if(session.hasTableId() && TableManager.isPlaying(session, tablesJson)) return server.redirect(res, `/table/${session.tableId}`)
        return super.httpResponse(res, 'index.html')
    }

    async tables(req: http.IncomingMessage, res: http.ServerResponse) {
        const tableJson = await TableManager.readJsonFile()
        const tables = TableManager.toTables(tableJson)
        return super.jsonResponse(res, tables)
    }
}

export { HomeController }