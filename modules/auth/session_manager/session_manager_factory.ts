import { DatabaseSessionManager } from "./database_session_manager";
import { FileSessionManager } from "./file_session_manager";


export class SessionManagerFactory {

    static create(sessionManagement: string) {
        if(!sessionManagement) throw new Error('SESSION is undefined')
        if(sessionManagement == 'database') return new DatabaseSessionManager()
        else if(sessionManagement == 'file')return new FileSessionManager()
        throw new Error('SESSION must be database or file')
    }
}