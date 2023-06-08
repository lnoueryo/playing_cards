import fs from 'fs';
import http from 'http';
import path from 'path';
import url from 'url';
import * as WebSocket from 'ws';
import { Session } from './modules/auth/auth_token';
import { CookieManager } from './modules/auth/cookie_manager';
import { routeHandlers, sessionRequiredRouteHandlers, tokenRequiredRouteHandlers } from './routes';
import { AuthToken, JsonWebToken, SessionManagerFactory } from './modules/auth';
import { config } from './main';

type Handler = (req: http.IncomingMessage, res: http.ServerResponse) => void;
type AuthenticatedHandler = (req: http.IncomingMessage, res: http.ServerResponse, session: AuthToken, params?: { [key: string]: string }) => void;

class Server {
  private routeHandlers: { [path: string]: {[path: string]: Handler} };
  private sessionRequiredRouteHandlers: { [path: string]: {[path: string]: AuthenticatedHandler} };
  private tokenRequiredRouteHandlers: { [path: string]: {[path: string]: AuthenticatedHandler} };
  private clients = new Map<number, WebSocket.WebSocket>();
  readonly SESSION_ID_COOKIE_KEY: string;
  readonly TOKEN_COOKIE_KEY: string;
  readonly SECRET_KEY: string;

  constructor(private httpPort: number) {
    if(!process.env.SESSION_ID_COOKIE_KEY) throw new Error('SESSION_ID_COOKIE_KEY is not defined on .env')
    if(!process.env.SECRET_KEY) throw new Error('SESSION_ID_COOKIE_KEY is not defined on .env')
    if(!process.env.TOKEN_COOKIE_KEY) throw new Error('TOKEN_COOKIE_KEY is not defined on .env')
    this.SESSION_ID_COOKIE_KEY = process.env.SESSION_ID_COOKIE_KEY
    this.TOKEN_COOKIE_KEY = process.env.TOKEN_COOKIE_KEY
    this.SECRET_KEY = process.env.SECRET_KEY
    this.routeHandlers = routeHandlers
    this.sessionRequiredRouteHandlers = sessionRequiredRouteHandlers;
    this.tokenRequiredRouteHandlers = tokenRequiredRouteHandlers;
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
      } catch (error) {
        console.log(error)
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Error: Not Found');
      }
      res.on('finish', () => {
        this.routingLog(req, res, start)
      });
    });
    this.createWebsocketServer(httpServer)
    httpServer.listen(this.httpPort, () => {
      console.log(`HTTP server is running on port ${this.httpPort}`);
    });
  }

  async routingHandler(req: http.IncomingMessage, res: http.ServerResponse) {
    const requestUrl = url.parse(req.url || '', true);
    const pathname = requestUrl.pathname || '/';
    // 静的ファイルへのリクエストに対する処理
    if (pathname.startsWith('/static/')) return this.handleStaticFile(req, res, pathname);

    // 認証が不要なパスに対する処理
    const cmSession = new CookieManager(req, res, this.SESSION_ID_COOKIE_KEY)
    const sessionId = cmSession.getCookieValue()
    const cmToken = new CookieManager(req, res, this.TOKEN_COOKIE_KEY)
    const token = cmToken.getCookieValue()

    if (req.method && pathname in this.routeHandlers[req.method]) {
      if(!sessionId) return this.routeHandlers[req.method][pathname](req, res);
      const session = await Session.createAuthToken(sessionId, cmSession, SessionManagerFactory.create(config.sessionManagement, config.DB));
      if (session) return this.backToPreviousPage(req, res);
    }

    if(!sessionId) return this.redirect(res, '/login');

    // セッションid認証
    if(token) {
      const jwt = await JsonWebToken.createAuthToken(token, cmToken, this.SECRET_KEY);
      if(!jwt) return this.redirect(res, '/')
      // 認証トークン
      if (req.method) {
        for (const pattern in this.tokenRequiredRouteHandlers[req.method]) {
          const params = this.matchPath(pattern, pathname);
          if(params) return this.tokenRequiredRouteHandlers[req.method][pattern](req, res, jwt, params || {id: ''});
        }
      }
    }

    const session = await Session.createAuthToken(sessionId, cmSession, SessionManagerFactory.create(config.sessionManagement, config.DB));

    if(!session) {
      cmSession.expireCookie()
      return this.redirect(res, '/login');
    }
    // ルーティング
    if (req.method) {
      for (const pattern in this.sessionRequiredRouteHandlers[req.method]) {
        const params = this.matchPath(pattern, pathname);
        if (!token) {
          if(params) return this.sessionRequiredRouteHandlers[req.method][pattern](req, res, session, params || {id: ''});
        }
        else {
          const jwt = await JsonWebToken.createAuthToken(token, cmToken, this.SECRET_KEY);
          if(jwt) return this.redirect(res, `/table/${jwt.user.table_id}`)
          cmToken.expireCookie()
        }
      }
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Error: Not Found');
    try {
    } catch (error) {
      console.error(error)
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      return res.end('Error: Error');
    }
  }

  createWebsocketServer(server: http.Server) {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
      ws.on('message', (id: number) => {
        if(!id) return ws.close();
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
        const clientId = (ws as any)?.clientId;
        if(!clientId) return;
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

  private matchPath(pattern: string, pathname: string): { [param: string]: string } | null {

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
    console.log(`${new Date().toISOString()} - Received request: ${req.method} ${req.url} from ${req.headers['x-forwarded-for'] || req.socket.remoteAddress} - Status: ${res.statusCode} - Response Time: ${duration}ms`);
    // console.log(`${new Date().toISOString()} - Received request: ${req.method} ${req.url} from ${req.headers['x-forwarded-for'] || req.socket.remoteAddress} - User Agent: ${req.headers['user-agent']} - Referrer: ${req.headers.referer} - Status: ${res.statusCode} - Response Time: ${duration}ms`);

  }
}

export { Server }