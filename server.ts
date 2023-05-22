import fs from 'fs';
import http from 'http';
import path from 'path';
import url from 'url';
import * as WebSocket from 'ws';
import { TableController, LoginController } from './controllers'
import { SessionManager } from './modules/auth';
import { Session } from './modules/auth/session';

type Handler = (req: http.IncomingMessage, res: http.ServerResponse) => void;
type AuthenticatedHandler = (req: http.IncomingMessage, res: http.ServerResponse, session: Session) => void;

class Server {
  private noAuthRequiredPaths: { [path: string]: {[path: string]: Handler} };
  private routeHandlers: { [path: string]: {[path: string]: AuthenticatedHandler} };
  private clients = new Map<number, WebSocket.WebSocket>();

  constructor(private port: number) {
    const tableController = new TableController()
    const loginController = new LoginController()

    this.noAuthRequiredPaths = {
      'GET': {
        '/login': loginController.index,
      },
      'POST': {
        '/api/login': loginController.login,
      }
    }

    this.routeHandlers = {
      'GET': {
        '/': tableController.index,
        '/api/table': tableController.tables,
        '/api/table/join': tableController.joinPlayer,
        '/start': tableController.start,
        '/draw': tableController.draw,
        '/discard': tableController.discard,
        '/api/user': loginController.user,
      },
      'POST': {
        '/api/table/create': tableController.create,
      }
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
      if (req.method && pathname in this.noAuthRequiredPaths[req.method]) {
        const session = SessionManager.authorize(req);
        if (session) return this.backToPreviousPage(req, res);
        return this.noAuthRequiredPaths[req.method][pathname](req, res);
      }

      // 認証
      const session = SessionManager.authorize(req);
      if (!session) return this.redirect(res, '/login');

      // ルーティング
      if (req.method && pathname in this.routeHandlers[req.method]) return this.routeHandlers[req.method][pathname](req, res, session);

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

      // ws.send('connect!');
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
    return ids.map((id) => this.clients.get(id));
  }

  getWSAllConnections() {
    return Array.from(this.clients.values());
  }

  backToPreviousPage(req: http.IncomingMessage, res: http.ServerResponse) {
    const referer = req.headers.referer;
    const refererUrl = url.parse(referer || '', true);
    const refererPathname = refererUrl.pathname || '/';
    return this.redirect(res, refererPathname);
  }
}

export { Server }