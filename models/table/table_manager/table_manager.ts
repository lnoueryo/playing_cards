import { AuthToken } from '../../../modules/auth';
import { Table } from '../index'

abstract class TableManager {
    abstract getTablesJson(): Promise<{[key: string]: TableJson}>
    abstract getTableJson(id: string): Promise<TableJson | undefined>
    abstract updateTableJson(table: Table): Promise<{[key: string]: TableJson}>
    abstract deleteTableJson(table: Table): Promise<{[key: string]: TableJson}>

    tableNotExists(id: string, tablesJson: {[key: string]: TableJson}): boolean {
        return id in tablesJson == false;
    }

    toTables(tablesJson: {[key: string]: TableJson}): Table[] {
        return Object.values(tablesJson).map((table: TableJson) => {
            return Table.createTable(table)
        })
    }
}

interface TableJson {
    "cardAggregate": {
        "cards": {
            "type": number,
            "number": number,
            "id": number
        }[],
        "discards": {
            "type": number,
            "number": number,
            "id": number
        }[]
    },
    "playerAggregate": {
        "players": {
            "id": number,
            "name": string,
            "hand": {
                "cards": {
                    "type": number,
                    "number": number,
                    "id": number
                }[]
            }
        }[]
    },
    "maxPlayers": number,
    "maxRounds": number,
    "maxGames": number,
    "id": string,
    "game": number,
    "round": number,
    "turn": number,
}

interface TablesJson {
    "cardAggregate": {
        "cards": {
            "type": number,
            "number": number,
            "id": number
        }[],
        "discards": {
            "type": number,
            "number": number,
            "id": number
        }[]
    },
    "playerAggregate": {
        "players": {
            "id": number,
            "name": string,
            "hand": {
                "cards": {
                    "type": number,
                    "number": number,
                    "id": number
                }[]
            }
        }[]
    },
    "maxPlayers": number,
    "maxRounds": number,
    "maxGames": number,
    "id": string,
    "game": number,
    "round": number,
    "turn": number,
}[]


export { TableManager, TableJson, TablesJson }