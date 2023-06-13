import { MongoDB } from '../../../modules/middleware/mongodb'
import { Table } from '../table'
import { TableJson } from './table_manager'

class DatabaseReplayManager {

    readonly connection: MongoDB
    constructor(connection: MongoDB) {
        this.connection = connection
    }

    async getUserTableJson(query: {[key: string]: any} = {}): Promise<any[]> {
        const tablesJson = await this.connection.getAll(query) as any
        return tablesJson
    }

    async createReplayTableJson(table: Table): Promise<{[key: string]: TableJson}> {
        const tableJson: { [key: string]: TableJson; } = {}
        await this.connection.insertOne(table);
        tableJson[table.id] = table
        return tableJson
    }


}

export { DatabaseReplayManager }