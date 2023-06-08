import * as fsPromises from 'fs/promises';
import { Table } from "../table";
import { Session } from '../../../modules/auth';
import { TableManager, TableJson, TablesJson } from './table_manager'
import { config } from '../../../main';
import { MongoDB } from '../../../modules/database/mongodb';
import { DatabaseTableAdaptor } from './database_table_adaptor';


class DatabaseTableManager extends TableManager {

    readonly adaptor: DatabaseTableAdaptor
    constructor(connection: MongoDB) {
        super();
        this.adaptor = new DatabaseTableAdaptor(connection)
    }

    async getTablesJson(): Promise<{[key: string]: TableJson}> {
        try {
            const tablesJson = await this.adaptor.getTablesJson()
            return tablesJson
        } catch (err) {
            console.error(`Error reading file from disk: ${err}`);
            return {};
        }
    }

    async getTableJson(id: string): Promise<TableJson | undefined> {
        try {
            const tableJson = await this.adaptor.getTablesJson()
            if(!tableJson[id]) return;
            return tableJson[id]
        } catch (err) {
            console.error(`Error reading file from disk: ${err}`);
            return;
        }
    }

    async createTableJson(table: Table): Promise<{[key: string]: TableJson}> {
        try {
            const tablesJson = await this.adaptor.createTableJson(table);
            return tablesJson;
        } catch (err) {
            console.error(`Error writing file on disk: ${err}`);
            return {}
        }
    }

    async updateTableJson(table: Table): Promise<{[key: string]: TableJson}> {
        try {
            const tablesJson = await this.adaptor.updateTableJson(table);
            return tablesJson;
        } catch (err) {
            console.error(`Error writing file on disk: ${err}`);
            return {}
        }
    }

    async deleteTableJson(table: Table) {
        try {
            await this.adaptor.deleteTableJson(table);
            const tablesJson = await this.getTablesJson()
            delete tablesJson[table.id]
            return tablesJson;
        } catch (err) {
            console.error(`Error writing file on disk: ${err}`);
            return {}
        }
    }

}

export { DatabaseTableManager }