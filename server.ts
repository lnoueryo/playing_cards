// src/server.ts
import http from 'http';
import url from 'url';
import { TableController } from './controllers'

const port = 3000;
const tableController = new TableController()

const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
    const requestUrl = url.parse(req.url || '', true);
    let filePath: string;

    switch (requestUrl.pathname) {
      case '/':
        tableController.index(req, res);
        break;
      case '/create':
        tableController.create(req, res);
        break;
      case '/join':
        tableController.joinPlayer(req, res);
        break;
      case '/start':
        tableController.start(req, res);
        break;
      case '/draw':
        tableController.draw(req, res);
        break;
      case '/discard':
        tableController.discard(req, res);
        break;
      default:
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Error: Not Found');
        return;
    }
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
