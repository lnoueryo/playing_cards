/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('sessions', function(table) {
    table.string('id', 255).primary();  // セッションIDを長い一意な文字列として設定
    table.integer('user_id').unsigned().references('id').inTable('users');
    table.string('table_id', 255).nullable().unique();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('sessions');
};


/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('sessions');
};
