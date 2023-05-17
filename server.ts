import fs from 'fs';
import http from 'http';
import path from 'path';
import url from 'url';
import * as WebSocket from 'ws';
import { TableController, LoginController } from './controllers'
import { SessionManager } from './modules/auth';

type Handler = (req: http.IncomingMessage, res: http.ServerResponse) => void;

class Server {
  private noAuthRequiredPaths: { [path: string]: Handler };
  private routeHandlers: { [path: string]: Handler };
  private clients = new Map<number, WebSocket.WebSocket>();

  constructor(private port: number) {
    const tableController = new TableController()
    const loginController = new LoginController()

    this.noAuthRequiredPaths = {
      '/login': loginController.index
    }

    this.routeHandlers = {
      '/': tableController.index,
      '/create': tableController.create,
      '/join': tableController.joinPlayer,
      '/start': tableController.start,
      '/draw': tableController.draw,
      '/discard': tableController.discard
    };
  }

  private handleStaticFile(req: http.IncomingMessage, res: http.ServerResponse, pathname: string) {
    const staticFilesDir = path.join(__dirname, 'public');
    const filePath = path.join(staticFilesDir, pathname.substring(7));
    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Error: Not Found');
        return;
      }
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    });
  };

  start() {
    const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
      const requestUrl = url.parse(req.url || '', true);
      const pathname = requestUrl.pathname || '/';

      // 静的ファイルへのリクエストに対する処理
      if (pathname.startsWith('/static/')) return this.handleStaticFile(req, res, pathname);

      // 認証が不要なパスに対する処理
      if (pathname in this.noAuthRequiredPaths) return this.noAuthRequiredPaths[pathname](req, res);

      // 認証
      const session = SessionManager.authorize(req);
      if (!session) return this.redirect(res, '/login');

      // ルーティング
      if (pathname in this.routeHandlers) return this.routeHandlers[pathname](req, res);

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Error: Not Found');
    });

    // WebSocketサーバーの作成
    const wss = new WebSocket.Server({ server });

    // connectionイベントのリスナーを設定します。
    wss.on('connection', (ws) => {
      ws.on('message', (id: number) => {
        console.log(`Received: ${id}`);
        this.clients.set(Number(id), ws);
        // Broadcast message to all connected clients
        // wss.clients.forEach((client) => {
        //   if (client.readyState === WebSocket.OPEN) {
        //     client.send(`Broadcast: ${id}`);
        //   }
        // });
      });
    
      ws.send('connect!');
    });

    server.listen(this.port, () => {
      console.log(`Server running at http://localhost:${this.port}/`);
    });
  }

  private redirect(res: http.ServerResponse, path: string) {
    res.statusCode = 302;  // or 301
    res.setHeader('Location', path);
    res.end();
  }

  getWSConnection(id: number) {
    return this.clients.get(id);
  }

  getWSConnections(ids: number[]) {
    console.log(ids)
    return ids.map((id) => this.clients.get(id));
  }
}

export { Server }