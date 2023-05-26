import { Server } from './server'


const httpPort = 3000;
const httpsPort = 3443;
const server = new Server(httpPort, httpsPort);
server.start();

export { server }