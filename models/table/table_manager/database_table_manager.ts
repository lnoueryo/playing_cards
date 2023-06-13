import { Table } from "../table";
import { TableManager, TableJson } from './table_manager'

import { MongoDB } from '../../../modules/middleware/mongodb';
import { DatabaseTableAdaptor } from './database_table_adaptor';


class DatabaseTableManager extends TableManager {

    readonly adaptor: DatabaseTableAdaptor
    constructor(connection: MongoDB) {
        super();
        this.adaptor = new DatabaseTableAdaptor(connection)
    }

    async getTablesJson(): Promise<{[key: string]: TableJson}> {
        const tablesJson = await this.adaptor.getTablesJson()
        return tablesJson
    }

    async getTableJson(id: string): Promise<TableJson | undefined> {
        const tableJson = await this.adaptor.getTablesJson()
        if(!tableJson[id]) return;
        return tableJson[id]
    }

    async createTableJson(table: Table): Promise<{[key: string]: TableJson}> {
        const tablesJson = await this.adaptor.createTableJson(table);
        return tablesJson;
    }

    async updateTableJson(table: Table): Promise<{[key: string]: TableJson}> {
        const tablesJson = await this.adaptor.updateTableJson(table);
        return tablesJson;
    }

    async deleteTableJson(table: Table) {
        await this.adaptor.deleteTableJson(table);
        const tablesJson = await this.getTablesJson()
        delete tablesJson[table.id]
        return tablesJson;
    }

}

export { DatabaseTableManager }