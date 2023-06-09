import { FileTableManager } from "."
import { MongoDB } from "../../../modules/middleware/mongodb"
import { DatabaseTableManager } from "./database_table_manager"



class TableManagerFactory {

    static create(connection: MongoDB) {

        const table = process.env.TABLE
        if(!table) throw new Error('SESSION is undefined')
        if(table == 'database') return new DatabaseTableManager(connection)
        else if(table == 'file')return new FileTableManager()
        throw new Error('SESSION must be database or file')
    }
}

export { TableManagerFactory }