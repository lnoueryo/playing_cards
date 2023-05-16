import fs from 'fs';
import http from 'http';
import path from 'path';
import url from 'url';
import { TableController, LoginController, Controller } from './controllers'
import { SessionManager } from './modules/auth';

type Handler = (req: http.IncomingMessage, res: http.ServerResponse) => void;

class Server {
  private noAuthRequiredPaths: { [path: string]: Handler };
  private routeHandlers: { [path: string]: Handler };

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
      if (pathname.startsWith('/static/')) {
        this.handleStaticFile(req, res, pathname);
        return;
      }

      // 認証が不要なパスに対する処理
      if (pathname in this.noAuthRequiredPaths) {
        this.noAuthRequiredPaths[pathname](req, res);
        return;
      }

      // 認証
      const session = SessionManager.authorize(req);
      if (!session) {
        this.redirect(res, '/login');
        return;
      }

      // ルーティング
      if (pathname in this.routeHandlers) {
        this.routeHandlers[pathname](req, res);
        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Error: Not Found');
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
}

export { Server }