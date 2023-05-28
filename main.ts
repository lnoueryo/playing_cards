import { Server } from './server'
require('dotenv').config();

const httpPort = 3000;
const httpsPort = 3443;
const server = new Server(httpPort, httpsPort);
if(process.env.MODE == 'development') server.startHTTPServer();
else server.startHTTPSServer()


export { server }