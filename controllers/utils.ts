import http from 'http';
import fs from 'fs';
import path from 'path';
import { Model } from '../models/utils';
import * as WebSocket from 'ws';

class Controller {

    protected templatePath = 'public/templates'

    protected httpResponse(res: http.ServerResponse, filename: string) {
        const filePath = path.join(__dirname, '..', 'public', filename);
        fs.readFile(filePath, 'utf8', (err, mainData) => {
            if (err) {
                console.error(err);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
                return;
            }

            const baseFileMatch = mainData.match(/{{ '(.+)' }}/);

            if (baseFileMatch) {
                const templateFileName = baseFileMatch[1];
                const templatePath = path.join(__dirname, '..', 'public/templates', templateFileName);
                fs.readFile(templatePath, 'utf8', (err, baseData) => {
                    if (err) {
                        console.error(err);
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Internal Server Error');
                        return;
                    }

                    const result = baseData.replace('{{% template %}}', mainData.replace(baseFileMatch[0], ''));
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(result);
                });
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(mainData);
        });
    }

    protected jsonResponse(res: http.ServerResponse, obj: Model | {}, statusCode = 200) {
        const responseContent = JSON.stringify(obj);
        const contentType = 'application/json';
        res.writeHead(statusCode, { 'Content-Type': contentType });
        res.end(responseContent);
    }

    protected WSResponse(table: {}, wss: (WebSocket.WebSocket | undefined)[]) {
        for(let ws of wss) {
            ws?.send(JSON.stringify(table))
        }
    }
    // getWSAllConnections
    protected async getBody(req: http.IncomingMessage) {
        return new Promise<{}>((resolve, reject) => {
            let body = '';
            req.on('readable', () => {
                let chunk;
                while ((chunk = req.read()) !== null) {
                    body += chunk;
                }
            });

            req.on('end', () => {
                resolve(JSON.parse(body));
            });

            req.on('error', (error) => {
                reject(error);
            });
        });
    }

}

export { Controller }