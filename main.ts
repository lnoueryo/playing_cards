import { Server } from './server'
require('dotenv').config();

const httpPort = 3500;
const httpsPort = 3500;
const server = new Server(httpPort);
server.startHTTPServer();

export { server }