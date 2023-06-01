import fs from 'fs';
import http from 'http';
import path from 'path';
import url from 'url';
import * as WebSocket from 'ws';
import { TableController, HomeController, LoginController } from './controllers'
import { SessionManager } from './modules/auth';
import { Session } from './modules/auth/session';

type Handler = (req: http.IncomingMessage, res: http.ServerResponse) => void;
type AuthenticatedHandler = (req: http.IncomingMessage, res: http.ServerResponse, session: Session, params?: { [key: string]: string }) => void;

class Server {
  private noAuthRequiredPaths: { [path: string]: {[path: string]: Handler} };
  private routeHandlers: { [path: string]: {[path: string]: AuthenticatedHandler} };
  private clients = new Map<number, WebSocket.WebSocket>();

  constructor(private httpPort: number) {
    const tableController = new TableController()
    const homeController = new HomeController()
    const loginController = new LoginController()

    this.noAuthRequiredPaths = {
      'GET': {
        '/login': loginController.index.bind(loginController),
      },
      'POST': {
        '/api/login': loginController.login.bind(loginController),
      }
    }

    this.routeHandlers = {
      'GET': {
        '/': homeController.index.bind(homeController),
        '/table/:id': tableController.index.bind(tableController),
        '/api/table': homeController.tables.bind(homeController),
        '/api/table/:id': tableController.show.bind(tableController),
        '/api/user': loginController.user.bind(loginController),
      },
      'POST': {
        '/api/logout': loginController.logout.bind(loginController),
        '/api/table/create': tableController.create.bind(tableController),
        '/api/table/:id/join': tableController.joinPlayer.bind(tableController),
        '/api/table/:id/reset': tableController.reset.bind(tableController),
        '/api/table/:id/next': tableController.next.bind(tableController),
        '/api/table/:id/exit': tableController.exit.bind(tableController),
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



  startHTTPServer() {

    const httpServer = http.createServer((req, res) => {
      const start = Date.now();
      try {
        this.routingHandler(req, res)
        this.createWebsocketServer(httpServer)
      } catch (error) {
        console.log(error)
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Error: Not Found');
      }
      res.on('finish', () => {
        this.routingLog(req, res, start)
      });
    });
    httpServer.listen(this.httpPort, () => {
      console.log(`HTTP server is running on port ${this.httpPort}`);
    });
  }

  start() {

    const httpServer = http.createServer((req, res) => {
      console.log(req.headers['host'])
      let host = req.headers['host'] as string;
      if (host.includes(':3000')) {
          host = host.replace(':3000', ':3443');
      }
      res.writeHead(301, { "Location": "https://" + host + req.url });
      res.end();
    });
    this.createWebsocketServer(httpServer)
    httpServer.listen(this.httpPort, () => {
      console.log(`HTTP server is running on port ${this.httpPort}`);
    });
  }

  routingHandler(req: http.IncomingMessage, res: http.ServerResponse) {
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
    if (req.method) {
      for (const pattern in this.routeHandlers[req.method]) {
        const params = this.matchPath(pattern, pathname);
        if (params) return this.routeHandlers[req.method][pattern](req, res, session, params);
      }
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Error: Not Found');
  }
  createWebsocketServer(server: http.Server) {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
      ws.on('message', (id: number) => {
        console.log(`Received: ${id}`);
        
        // Check if the client is already connected
        // if (this.clients.has(Number(id))) {
        //   console.log(`Client with id ${id} is already connected. Closing the new connection.`);
        //   ws.close();  // Close the new connection
        //   return;
        // }
    
        this.clients.set(Number(id), ws);
        (ws as any).clientId = Number(id);
      });
    
      ws.on('close', () => {
        console.log('Connection closed');
        const clientId = (ws as any).clientId;
        this.clients.delete(clientId);
      });
    
      ws.send(JSON.stringify({message: 'connect!'}));
    });
  }

  redirect(res: http.ServerResponse, path: string) {
    res.statusCode = 302;  // or 301
    res.setHeader('Location', path);
    res.end();
  }

  matchPath(pattern: string, pathname: string): { [param: string]: string } | null {
    const keys: string[] = [];
    pattern = pattern.replace(/:([^\/]+)/g, (_, key) => {
      keys.push(key);
      return '([^\/]+)';
    });

    const match = pathname.match(new RegExp('^' + pattern + '$'));
    if (match) {
      const params = match.slice(1);
      return keys.reduce((memo, key, index) => {
        memo[key] = params[index];
        return memo;
      }, {} as { [param: string]: string });
    }

    return null;
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

  routingLog(req: http.IncomingMessage, res: http.ServerResponse, start: number) {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - Received request: ${req.method} ${req.url} from ${req.headers['x-forwarded-for'] || req.socket.remoteAddress} - User Agent: ${req.headers['user-agent']} - Referrer: ${req.headers.referer} - Status: ${res.statusCode} - Response Time: ${duration}ms`);

  }
}

export { Server }