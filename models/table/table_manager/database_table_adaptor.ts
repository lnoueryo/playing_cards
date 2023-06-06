import { config } from '../../../main'
import { MongoDB } from '../../../modules/database/mongodb'
import { Table } from '../table'
import { TableJson } from './table_manager'

class DatabaseTableAdaptor {

    readonly connection: MongoDB
    constructor() {
        this.connection = config.mongoDB
    }

    async getTablesJson(): Promise<{[key: string]: TableJson}> {
        try {
            const tablesJson = await this.connection.getAll()
            const tableJson: any = {}
            tablesJson?.forEach(table => {
                tableJson[table.id] = table;
            })
            return tableJson
        } catch (err) {
            console.error(`Error reading file from disk: ${err}`);
            return {};
        }
    }

    async createTableJson(table: Table): Promise<{[key: string]: TableJson}> {
        try {
            const tableJson: { [key: string]: TableJson; } = {}
            await this.connection.insertOne(table);
            tableJson[table.id] = table
            return tableJson
        } catch (err) {
            console.error(`Error writing file on disk: ${err}`);
            return {}
        }
    }

    async updateTableJson(table: Table): Promise<{[key: string]: TableJson}> {
        try {
            const query = {id: table.id}
            const tableJson: { [key: string]: TableJson; } = {}
            const tablesJson = await this.connection.replaceOne(query, table);
            tableJson[table.id] = table
            return tableJson
        } catch (err) {
            console.error(`Error writing file on disk: ${err}`);
            return {}
        }
    }

    // JSONファイルへの書き込み
    async deleteTableJson(table: Table) {
        try {
            const query = {id: table.id}
            const tableJson: { [key: string]: TableJson; } = {}
            await this.connection.deleteOne(query);
            tableJson[table.id] = table
            return tableJson;
        } catch (err) {
            console.error(`Error writing file on disk: ${err}`);
            return {}
        }
    }

}

export { DatabaseTableAdaptor }