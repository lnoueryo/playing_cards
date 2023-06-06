import { Mysql } from "../../modules/database/mysql";


interface ModelBase {
    toJson(): any
}


class ModelBase implements ModelBase {

    constructor(readonly created_at: string, readonly updated_at: string) {}

}


class ModelManager {

    constructor(protected readonly db: Mysql, protected readonly table: string, protected readonly columns: string[], protected readonly query = '', protected readonly whereQuery = '', protected readonly result: [] = []) {

    }

    select(exclusion: string[] = []) {
        const exclusionSet = new Set(exclusion);
        let query = 'SELECT '
        const excludedColumns = this.columns.filter(column => !exclusionSet.has(column));
        excludedColumns.forEach(column => query += column + ', ')
        query = query.replace(/,\s*$/, ' ') + 'FROM ' + this.table;
        return new ModelManager(this.db, this.table, this.columns, query)
    }

    where(column: string, condition: string) {
        let whereQuery = this.whereQuery;
        if (!whereQuery) {
            whereQuery = 'WHERE ' + column + ' ' + condition + ' ? ';
        } else {
            whereQuery += ' AND ' + column + ' ' + condition + ' ? ';
        }
        return new ModelManager(this.db, this.table, this.columns, this.query, whereQuery);
    }

    orWhere(column: string, condition: string, value: string) {
        let whereQuery = this.whereQuery;
        if (!whereQuery) {
            whereQuery = 'WHERE ' + column + ' ' + condition + ' ? ';
        } else {
            whereQuery += ' OR ' + column + ' ' + condition + ' ? ';
        }
        return new ModelManager(this.db, this.table, this.columns, this.query, whereQuery);
    }

    async excute(params: any[] = []) {
        const results = await this.db.query(this.query, params);
        if(results.length == 0) return;
        return results;
    }

}

export { ModelBase, ModelManager}