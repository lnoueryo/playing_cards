import { config } from "../main"
import { Mysql } from "../modules/database/mysql"


interface Model {
    toJson(): any
}

class ModelBase {

    protected table: string
    private readonly DB: Mysql
    constructor(table: string, private readonly columns: string[], protected query: string = '', protected whereQuery: string = '') {
        this.table = table;
        this.DB = config.DB
    }

    _where(column: string, condition: string, whereQuery: string = '') {
        if (!whereQuery) {
            whereQuery = 'WHERE ' + column + ' ' + condition + ' ? ';
        } else {
            whereQuery += ' AND ' + column + ' ' + condition + ' ? ';
        }
        return whereQuery;
    }

    orWhere(column: string, condition: string, value: string): void {
        if (!this.whereQuery) {
            this.whereQuery = 'WHERE ' + column + ' ' + condition + ' ? ';
        } else {
            this.whereQuery += ' OR ' + column + ' ' + condition + ' ? ';
        }
    }

    async excute(params: any[] = []) {
        const result = await this.DB.query(this.query, params);
        this.query = '';
        this.whereQuery = '';
        return result;
    }

    _select(exclusion: string[] = []) {
        const exclusionSet = new Set(exclusion);
        let query = 'SELECT '
        const excludedColumns = this.columns.filter(column => !exclusionSet.has(column));
        excludedColumns.forEach(column => query += column + ', ')
        return query.replace(/,\s*$/, '') + 'FROM ' + this.table;
    }

}

export { Model, ModelBase }
