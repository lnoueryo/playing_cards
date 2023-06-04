require('dotenv').config();
// knexfile.js
console.log(process.env.DB_PASSWORD, process.env.DB_USER)
module.exports = {
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  migrations: {
    tableName: 'knex_migrations'
  }
};