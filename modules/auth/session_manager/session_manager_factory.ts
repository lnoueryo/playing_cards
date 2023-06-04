import { FileSessionManager } from "./file_session_manager";


export class SessionManagerFactory {

    static create() {
        return new FileSessionManager()
    }
}