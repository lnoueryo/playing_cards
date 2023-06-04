import { Server } from './server'
require('dotenv').config();

const httpPort = 3100;
const httpsPort = 3100;
const server = new Server(httpPort);
server.startHTTPServer();

export { server }