import { MongoDB } from '../../../modules/database/mongodb'
import { Table } from '../table'
import { TableJson } from './table_manager'

class DatabaseReplayManager {

    readonly connection: MongoDB
    constructor(connection: MongoDB) {
        this.connection = connection
    }

    async getUserTableJson(): Promise<{[key: string]: TableJson}> {
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

    async createReplayTableJson(table: Table): Promise<{[key: string]: TableJson}> {
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


}

export { DatabaseReplayManager }