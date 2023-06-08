// setupTestDB.ts
import { Knex } from 'knex';

async function setupTestDB(): Promise<Knex> {
    let db: Knex;
    try {
        const dbForCreation = require('knex')({
            client: 'mysql2',
            connection: {
                host: process.env.TEST_DB_HOST,
                user: process.env.TEST_DB_USER,
                password: process.env.TEST_DB_PASSWORD,
                // データベース名は指定しない
            },
        });
        await dbForCreation.raw(`CREATE DATABASE IF NOT EXISTS ${process.env.TEST_DB_NAME}`);
        await dbForCreation.destroy();

        db = require('knex')({
            client: 'mysql2',
            connection: {
                host: process.env.TEST_DB_HOST,
                user: process.env.TEST_DB_USER,
                password: process.env.TEST_DB_PASSWORD,
                database: process.env.TEST_DB_NAME,
            },
            migrations: {
                tableName: 'knex_migrations',
            },
        });

        await db.migrate.latest();  // 最新のマイグレーションを実行
    } catch (error) {
        console.error("Failed to setup the database:", error);
        // await db.migrate.rollback();
        throw error;
    }
    return db
}

async function teardownTestDB(db: Knex) {
    try {
        if (db) {
            // await db.migrate.rollback();  // マイグレーションをロールバック（データベースを初期状態に戻す）

            // 別のKnexインスタンスを作成して、データベースを削除
            const dbForDropping = require('knex')({
                client: 'mysql2',
                connection: {
                    host: process.env.TEST_DB_HOST,
                    user: process.env.TEST_DB_USER,
                    password: process.env.TEST_DB_PASSWORD,
                    // データベース名は指定しない
                },
            });
            await dbForDropping.raw(`DROP DATABASE IF EXISTS ${process.env.TEST_DB_NAME}`);
            await dbForDropping.destroy();

            return await db.destroy();  // データベース接続を終了
        }
    } catch (error) {
        console.error("Failed to teardown the database:", error);
        throw error;
    }
}

export { setupTestDB, teardownTestDB };
