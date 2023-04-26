// src/server.ts
import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { TableController } from './controllers'

const port = 3000;

const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
    const requestUrl = url.parse(req.url || '', true);
    let filePath: string;

    switch (requestUrl.pathname) {
      case '/':
        TableController.index(req, res);
        break;
      case '/create':
        TableController.create(req, res);
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
