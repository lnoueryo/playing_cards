import http from 'http';
import fs from 'fs';
import path from 'path';
import { Model } from '../models/utils';
import * as WebSocket from 'ws';
import { config } from '../main';
import { TableManagerFactory } from '../models/table/table_manager/table_manager_factory';
import { Table } from '../models/table';
import { CardBase } from '../models/card';
import { DatabaseReplayManager } from '../models/table/table_manager/database_replay_manager';

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

    protected WSTableResponse(table: {[key: string]: any}, wss: (WebSocket.WebSocket | undefined)[]) {
        for(let ws of wss) {
            console.log(table)
            ws?.send(JSON.stringify(table))
        }
    }

    protected WSHidCardsTableResponse(table: {[key: string]: any}, wss: (WebSocket.WebSocket | undefined)[]) {
        for(let ws of wss) {
            const hidCardTable = JSON.parse(JSON.stringify(table))
            const id = (ws as any).clientId;
            hidCardTable.table = table['table'].hideCards(id)
            ws?.send(JSON.stringify(hidCardTable))
        }
    }

    protected WSTablesResponse(table: {}, wss: (WebSocket.WebSocket | undefined)[]) {
        for(let ws of wss) {
            ws?.send(JSON.stringify(table))
        }
    }
    // getWSAllConnections
    protected async getBody(req: http.IncomingMessage) {
        return new Promise<any>((resolve, reject) => {
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

class TableRule extends Controller {

    protected timers = new Map()
    protected timeout = 10000
    protected endGameTimers = new Map()
    protected endGameTimeout = 15000
    protected replay = false
    protected replayConsumers = new Map()

    protected async discardAndDraw(table: Table, card: CardBase) {

        const playerInTurnId = table.getPlayerInTurn().id
        const time = this.timers.get(playerInTurnId);
        if(time) {
            clearTimeout(time.timer)
            this.timers.delete(playerInTurnId)
        }
        const discardedTable = table.discard(card)

        const wss = config.server.getWSConnections(discardedTable.getPlayerIds())
        // 次のゲーム
        if(discardedTable.isGameEndRoundReached()) {
            const endGameTable = discardedTable.endGame()

            const tm = TableManagerFactory.create(config.mongoTable)
            const tablesJson = await tm.updateTableJson(endGameTable)
            await this.insertReplay(endGameTable)

            endGameTable.playerAggregate.players.forEach(player => {
                console.log(player.hand)
            })
            this.WSTableResponse({table: endGameTable}, wss)

            // ゲーム終了
            if(endGameTable.isGameEndReached()) {
                const endGameTimer = setTimeout(async() => {
                    const tm = TableManagerFactory.create(config.mongoTable)
                    const tableJson = await tm.getTableJson(endGameTable.id)
                    if(!tableJson) return endGameTable;
                    const table = Table.createTable(tableJson)
                    const ids = table.getPlayerIds()
                    for(const id of ids) {
                        await endGameTable.deleteTable(config.DB, id)
                    }
                    await tm.deleteTableJson(endGameTable)
                    //　キュー削除

                    this.endGameTimers.delete(endGameTable.id)
                    const wssTable = config.server.getWSConnections(endGameTable.getPlayerIds())
                    this.WSTableResponse({table: ''}, wssTable)

                    const tablesJson = await tm.getTablesJson()
                    const wssHome = config.server.getWSAllConnections()
                    const tables = tm.toTables(tablesJson)
                    super.WSTablesResponse({tables: tables}, wssHome)
                }, this.endGameTimeout)
                this.endGameTimers.set(endGameTable.id, endGameTimer)
                return endGameTable
            }
            // TODO　まだ試していない
            setTimeout(async() => {
                const tableJson = tablesJson[endGameTable.id]
                const table = Table.createTable(tableJson)
                const preparedTable = table.prepareNextGame()

                const nextGameStartTable = preparedTable.handOverCards().drawCard()

                const tm = TableManagerFactory.create(config.mongoTable)
                await tm.updateTableJson(nextGameStartTable)

                await this.insertReplay(nextGameStartTable)
                this.WSTableResponse({table: nextGameStartTable}, wss)
            }, this.timeout)
            return endGameTable
        }

        // 次のターン
        const drawCardTable = discardedTable.drawCard()

        const tm = TableManagerFactory.create(config.mongoTable)
        await tm.updateTableJson(drawCardTable)
        await this.insertReplay(drawCardTable)

        this.setTurnTimer(drawCardTable, wss)
        return drawCardTable;
    }

    protected setTurnTimer(table: Table, wss: (WebSocket.WebSocket | undefined)[]) {

        const playerInTurn = table.getPlayerInTurn()
        const start = Date.now(); // タイマー開始時刻を記録
        const timer = setTimeout(() => {
            const drawnCard = playerInTurn.getDrawnCard()
            this.discardAndDraw(table, drawnCard)
        }, this.timeout)

        this.timers.set(playerInTurn.id, {timer, start})
        console.log({table: table, [playerInTurn.id]: {time: {start, timeout: this.timeout}}})
        this.WSHidCardsTableResponse({table: table, [playerInTurn.id]: {time: {start, timeout: this.timeout}}}, wss)
    }

    protected async getTables() {
        const tm = TableManagerFactory.create(config.mongoTable)
        const tableJson = await tm.getTablesJson()
        return tm.toTables(tableJson)
    }

    protected async getTable(id: string) {

        const tm = TableManagerFactory.create(config.mongoTable)
        const tableJson = await tm.getTableJson(id)
        if(!tableJson) return;
        return Table.createTable(tableJson)
    }

    protected async insertReplay(table: Table) {
        if(!this.replay) return;
        const drm = new DatabaseReplayManager(config.mongoReplay)
        drm.createReplayTableJson(table)
        // config.rmqc.sendQueue(table)
    }

}

export { Controller, TableRule }