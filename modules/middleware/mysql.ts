import mysql, { Pool  } from 'mysql2/promise';

class Mysql {
    readonly pool: Pool;
    private readonly maxRetries: number = 3;
    private readonly backoff: number = 2;
    private readonly initialDelay: number = 500; // in milliseconds

    private readonly host: string
    private readonly user: string
    private readonly password: string | undefined
    private readonly database: string

    constructor(
        host: string | undefined,
        user: string | undefined,
        password: string | undefined,
        database: string | undefined
    ) {
        if(!host || !user || !database) throw new Error('host or user or database is undefined')
        this.host = host
        this.user = user
        this.password = password
        this.database = database

        this.pool = mysql.createPool({
            host: this.host,
            user: this.user,
            password: this.password,
            database: this.database,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            connectTimeout: 3000
        });
    }

    async query(queryString: string, params: any[], retries: number = this.maxRetries): Promise<any> {

        try {
            const [rows] = await this.pool.execute(queryString, params);
            return rows;

        } catch (error: any) {

            if (retries <= 0) {
                throw new Error(`Failed to execute query after ${this.maxRetries} attempts: ${error.message}`);
            }
            const delay = this.initialDelay * this.backoff ** (this.maxRetries - retries);
            console.error(`Query failed, retrying in ${delay}ms (${retries} retries left)...`);
            await this.sleep(delay);
            return this.query(queryString, params, retries - 1);
        }
    }

    async transaction(handler: any, retries: number = this.maxRetries): Promise<any> {
        // Start transaction
        const connection = await this.pool.getConnection();
        await connection.beginTransaction();

        try {

            const results = await handler(connection)
            if(!results) {
                await connection.rollback();
                throw new Error('Something wrong')
            }

            await connection.commit();
            return results;

        } catch (error: any) {

            await connection.rollback();
            if (retries <= 0) {
                await connection.release()
                throw new Error(`Failed to execute query after ${this.maxRetries} attempts: ${error.message}`);
            }

            const delay = this.initialDelay * this.backoff ** (this.maxRetries - retries);
            console.error(`Query failed, retrying in ${delay}ms (${retries} retries left)...`);
            await this.sleep(delay);
            return this.transaction(handler, retries - 1);

        } finally {
            await connection.release()
        }
    }

    async close() {
        await this.pool.end();
    }

    private sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export { Mysql }




