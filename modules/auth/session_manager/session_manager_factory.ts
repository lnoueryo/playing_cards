import { DatabaseSessionManager } from "./database_session_manager";
import { FileSessionManager } from "./file_session_manager";


export class SessionManagerFactory {

    static create() {
        const session = process.env.SESSION
        if(!session) throw new Error('SESSION is undefined')
        if(session == 'database') return new DatabaseSessionManager()
        else if(session == 'file')return new FileSessionManager()
        throw new Error('SESSION must be database or file')
    }
}