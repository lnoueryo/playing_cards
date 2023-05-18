import http from 'http';
import { Controller } from "./utils";
import fs from 'fs';
import path from 'path';


class LoginController extends Controller {
    index(req: http.IncomingMessage, res: http.ServerResponse) {
        return super.httpResponse(res, 'login.html')
    }
}

export { LoginController }