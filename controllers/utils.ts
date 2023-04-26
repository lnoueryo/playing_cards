import http from 'http';
import fs from 'fs';
import path from 'path';
import { Model } from '../models/utils';
class Controller {

    httpResponse(res: http.ServerResponse, filename: string) {
        const filePath = path.join(__dirname, '..', 'public', filename);
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
              res.writeHead(500, { 'Content-Type': 'text/plain' });
              res.end(`Error: Unable to load ${filePath}`);
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    }

    protected jsonResponse(res: http.ServerResponse, obj: Model | {}) {
        const responseContent = JSON.stringify(obj);
        const contentType = 'application/json';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(responseContent);
    }

}

export { Controller }