import { MongoDB } from '../../../modules/middleware/mongodb'
import { Table } from '../table'
import { TableJson } from './table_manager'

class DatabaseTableAdaptor {

    readonly connection: MongoDB
    constructor(connection: MongoDB) {
        this.connection = connection
    }

    async getTablesJson(): Promise<{[key: string]: TableJson}> {
        const tablesJson = await this.connection.getAll()
        const tableJson: any = {}
        tablesJson?.forEach(table => {
            tableJson[table.id] = table;
        })
        return tableJson
    }

    async getTableJson(id: string): Promise<{[key: string]: TableJson} | undefined> {
        const query = {id: id}
        const _tableJson = await this.connection.getOne(query)
        // TODO なかった時の処理
        const tableJson: any = {}
        tableJson[id] = _tableJson
        return tableJson
    }

    async createTableJson(table: Table): Promise<{[key: string]: TableJson}> {
        const tableJson: { [key: string]: TableJson; } = {}
        await this.connection.insertOne(table);
        tableJson[table.id] = table
        return tableJson
    }

    async updateTableJson(table: Table): Promise<{[key: string]: TableJson}> {
        const query = {id: table.id}
        const tableJson: { [key: string]: TableJson; } = {}
        const tablesJson = await this.connection.replaceOne(query, table);
        tableJson[table.id] = table
        return tableJson
    }

    // JSONファイルへの書き込み
    async deleteTableJson(table: Table) {
        const query = {id: table.id}
        const tableJson: { [key: string]: TableJson; } = {}
        await this.connection.deleteOne(query);
        tableJson[table.id] = table
        return tableJson;
    }

}

export { DatabaseTableAdaptor }