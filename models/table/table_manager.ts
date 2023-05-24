import fs from 'fs/promises';
import { TableBase, Table } from "./table";
import path from 'path';
import { Session } from '../../modules/auth/session';


class TableManager {

    private static filePath = path.join(__dirname, '..', '..', 'storage/tables.json');

    // JSONファイルの読み取り
    static async readJsonFile(): Promise<{[key: string]: Table}> {
        try {
            const data = await fs.readFile(TableManager.filePath, 'utf8');
            return JSON.parse(data) as {[key: string]: Table}
        } catch (err) {
            console.error(`Error reading file from disk: ${err}`);
            return {};
        }
    }

    // JSONファイルへの書き込み
    static async writeJsonFile(table: TableBase): Promise<{[key: string]: Table}> {
        try {
            const tablesJson = await TableManager.readJsonFile()
            tablesJson[table.id] = table.convertToJson()
            await fs.writeFile(TableManager.filePath, JSON.stringify(tablesJson, null, 2), 'utf8');
            return tablesJson
        } catch (err) {
            console.error(`Error writing file on disk: ${err}`);
            return {}
        }
    }

    // JSONファイルの読み取り
    static async isPlaying(session: Session): Promise<boolean> {
        const data = await TableManager.readJsonFile()
        return session.data.tableId in data && data[session.data.tableId].playerAggregate.players.some((player) => player.id == session.data.id)
    }

    static toTables(tableJson: {[key: string]: Table}): TableBase[] {
        return Object.values(tableJson).map((table: Table) => {
            return TableBase.createTable(table)
        })
    }
}

export { TableManager }