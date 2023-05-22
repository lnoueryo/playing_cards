import fs from 'fs/promises';
import { TableBase, Table } from "./table";
import path from 'path';


class TableManager {

    private static filePath = path.join(__dirname, '..', '..', 'storage/tables.json');

    // JSONファイルの読み取り
    static async readJsonFile(): Promise<{[key: number]: Table}> {
        try {
            const data = await fs.readFile(TableManager.filePath, 'utf8');
            return JSON.parse(data) as {[key: number]: Table}
        } catch (err) {
            console.error(`Error reading file from disk: ${err}`);
            return [];
        }
    }

    // JSONファイルへの書き込み
    static async writeJsonFile(table: TableBase): Promise<{[key: number]: Table}> {
        try {
            const tablesJson = await TableManager.readJsonFile()
            tablesJson[table.id] = table.convertToTable()
            await fs.writeFile(TableManager.filePath, JSON.stringify(tablesJson, null, 2), 'utf8');
            return tablesJson
        } catch (err) {
            console.error(`Error writing file on disk: ${err}`);
            return {}
        }
    }

    static toTables(tableJson: {[key: number]: Table}): TableBase[] {
        return Object.values(tableJson).map((table: Table) => {
            return TableBase.createTable(table)
        })
    }
}

export { TableManager }