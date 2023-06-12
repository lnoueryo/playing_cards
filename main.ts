import { Mysql } from './modules/database/mysql';
import { MongoDB } from './modules/database/mongodb';
import { Server } from './server'
import { RabbitMQClient } from './modules/database/rabbitmq';
require('dotenv').config();

const httpPort = 3100;

const server = new Server(httpPort);
server.startHTTPServer();

const host = process.env.DB_HOST
const user = process.env.DB_USER
const password = process.env.DB_PASSWORD
const name = process.env.DB_NAME
const DB = new Mysql(host, user, password, name)

const mongo_host = process.env.MONGO_DB_HOST
const mongo_user = process.env.MONGO_DB_USER
const mongo_password = process.env.MONGO_DB_PASSWORD
const mongo_port = process.env.MONGO_DB_PORT
const mongo_name = process.env.MONGO_DB_NAME
const mongo_table_collection = process.env.MONGO_DB_TABLE_COLLECTION
const mongo_replay_collection = process.env.MONGO_DB_REPLAY_COLLECTION
const mongoTable = new MongoDB(mongo_host, mongo_user, mongo_password, mongo_port, mongo_name, mongo_table_collection)
const mongoReplay = new MongoDB(mongo_host, mongo_user, mongo_password, mongo_port, mongo_name, mongo_replay_collection)

const secretKey = process.env.SECRET_KEY || ''
const sessionIdCookieKey = process.env.SESSION_ID_COOKIE_KEY || ''
const tokenCookieKey = process.env.TOKEN_COOKIE_KEY || ''

const tableToken = process.env.TABLE_TOKEN || ''
const sessionManagement = process.env.SESSION_MANAGEMENT || ''

const rabbitmq_host = process.env.RABBITMQ_HOST || ''
const rmqc = RabbitMQClient.createChannel(rabbitmq_host)

const config = {
    server,
    DB,
    mongoTable,
    mongoReplay,
    secretKey,
    sessionIdCookieKey,
    tokenCookieKey,
    tableToken,
    sessionManagement,
    rmqc,
}
export { config }