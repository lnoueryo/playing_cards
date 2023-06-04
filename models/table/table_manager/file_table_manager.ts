import * as fsPromises from 'fs/promises';
import { Table } from "../table";
import path from 'path';
import { Session } from '../../../modules/auth';
import { TableManager, TableJson } from './table_manager'
import { throws } from 'assert';


class FileTableManager extends TableManager {

    private readonly TABLE_FILE_PATH: string

    constructor() {
        super();
        if(!process.env.TABLE_FILE_PATH) {
            throw new Error('TABLE_FILE_PATH is not defined on .env')
        }
        this.TABLE_FILE_PATH = process.env.TABLE_FILE_PATH;
    }

    // JSONファイルの読み取り
    async getTablesJson(): Promise<{[key: string]: TableJson}> {
        try {
            const tablesJson = await fsPromises.readFile(this.TABLE_FILE_PATH, 'utf8');
            return JSON.parse(tablesJson) as {[key: string]: TableJson}
        } catch (err) {
            console.error(`Error reading file from disk: ${err}`);
            throw new Error(`Error reading file from disk: ${err}`)
        }
    }

    // JSONファイルへの書き込み
    async createTableJson(table: Table): Promise<{[key: string]: TableJson}> {
        return this.updateTableJson(table)
    }

    // JSONファイルへの書き込み
    async updateTableJson(table: Table): Promise<{[key: string]: TableJson}> {
        try {
            const tablesJson = await this.getTablesJson()
            tablesJson[table.id] = table.convertToJson()
            await fsPromises.writeFile(this.TABLE_FILE_PATH, JSON.stringify(tablesJson, null, 2), 'utf8');
            return tablesJson
        } catch (err) {
            console.error(`Error writing file on disk: ${err}`);
            return {}
        }
    }

    // JSONファイルへの書き込み
    async deleteTableJson(table: Table): Promise<{[key: string]: TableJson}> {
        try {
            const tablesJson = await this.getTablesJson()
            delete tablesJson[table.id]
            await fsPromises.writeFile(this.TABLE_FILE_PATH, JSON.stringify(tablesJson, null, 2), 'utf8');
            return tablesJson
        } catch (err) {
            console.error(`Error writing file on disk: ${err}`);
            return {}
        }
    }

    static toTables(tablesJson: {[key: string]: TableJson}): Table[] {
        return Object.values(tablesJson).map((table: TableJson) => {
            return Table.createTable(table)
        })
    }
}

export { FileTableManager }