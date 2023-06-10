import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('tables', function(table) {
        table.string('id').primary();
        table.boolean('start').defaultTo(false);
        table.boolean('active').defaultTo(true);
        table.integer('max_players');
        table.integer('max_rounds');
        table.integer('max_games');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema
      .dropTableIfExists('tables_users')
      .then(() => knex.schema.dropTableIfExists('tables'));
}

