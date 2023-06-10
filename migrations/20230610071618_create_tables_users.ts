import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('tables_users', function(table) {
        table.string('table_id');
        table.integer('user_id').unsigned();
        table.boolean('active').defaultTo(true);

        table.foreign('table_id').references('tables.id');
        table.foreign('user_id').references('users.id');

        table.primary(['table_id', 'user_id']);
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('tables_users');
}
