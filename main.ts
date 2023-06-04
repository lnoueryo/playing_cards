import { Mysql } from './modules/database/mysql';
import { Server } from './server'
require('dotenv').config();



const httpPort = 3500;
const httpsPort = 3500;
const server = new Server(httpPort);
server.startHTTPServer();

const host = process.env.DB_HOST
const user = process.env.DB_USER
const password = process.env.DB_PASSWORD
const name = process.env.DB_NAME
const db = new Mysql(host, user, password, name)


const config = {
    server: server,
    db: db
}
export { config }