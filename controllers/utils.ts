import http from 'http';
import fs from 'fs';
import path from 'path';
import { Model } from '../models/utils';
class Controller {

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
            console.log(baseFileMatch)
            if (baseFileMatch) {
                const templateFileName = baseFileMatch[1];
                const templatePath = path.join(__dirname, '..', 'public', templateFileName);
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

    protected jsonResponse(res: http.ServerResponse, obj: Model | {}) {
        const responseContent = JSON.stringify(obj);
        const contentType = 'application/json';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(responseContent);
    }

}

export { Controller }