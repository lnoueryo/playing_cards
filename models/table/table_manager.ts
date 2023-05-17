import fs from 'fs/promises';
import { TableBase, Table } from "./table";
import path from 'path';


class TableManager {

    private static filePath = path.join(__dirname, '..', '..', 'storage/tables.json');

    // JSONファイルの読み取り
    static async readJsonFile(): Promise<{[key: number]: Table}> {
        try {
            const data = await fs.readFile(TableManager.filePath, 'utf8');
            return JSON.parse(data);
        } catch (err) {
            console.error(`Error reading file from disk: ${err}`);
            return {};
        }
    }

    // JSONファイルへの書き込み
    static async writeJsonFile(table: TableBase): Promise<void> {
        try {
            const data: {[key: number]: TableBase} = {};
            data[table.id] = table
            await fs.writeFile(TableManager.filePath, JSON.stringify(data, null, 2), 'utf8');
        } catch (err) {
            console.error(`Error writing file on disk: ${err}`);
        }
    }
}

export { TableManager }