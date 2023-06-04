import { config } from "../../main"
import { Mysql } from "../../modules/database/mysql"
import { Model, ModelBase, ModelManager } from "./model_manager"


interface UserJson {
    id?: number
    name?: string
    password?: string
    email?: string
    session?: string
    token?: string
    image?: string
    createdAt?: string
}

class User extends ModelBase {
    public id: number
    public name: string
    public password: string
    public email: string
    public session: string
    public token: string
    public image: string

    constructor(userJson?: UserJson) {
        const columns = [
            'id',
            'name',
            'password',
            'email',
            'session',
            'token',
            'image',
        ]
        super(userJson, columns)
        this.id = userJson?.id || 0;
        this.name = userJson?.name || '';
        this.password = userJson?.password || '';
        this.email = userJson?.email || '';
        this.session = userJson?.session || '';
        this.token = userJson?.token || '';
        this.image = userJson?.image || '';
    }

    async getUserByEmail(params: any, exclusions: string[] = []) {
        let query = super.createSelectQuery(exclusions)
        return await config.DB.query(`${query} WHERE email = ?`, params)
    }

}
export { User, UserJson }

//   class User extends ModelBase implements Model {

//     public id: number
//     public name: string
//     public password: string
//     public email: string
//     public session: string
//     public token: string
//     public image: string

//     protected readonly manager: ModelManager
//     constructor(manager: ModelManager, userJson?: UserJson) {
//         super(userJson)
//         this.id = userJson?.id || 0;
//         this.name = userJson?.name || '';
//         this.password = userJson?.password || '';
//         this.email = userJson?.email || '';
//         this.session = userJson?.session || '';
//         this.token = userJson?.token || '';
//         this.image = userJson?.image || '';
//         this.manager = manager
//     }

//     select(exclusion: string[] = []) {
//         const manager = this.manager.select(exclusion)
//         return new User(
//             manager,
//             this.toJson()
//         );
//     }
//     where(column: string, condition: string) {
//         const manager = this.manager.where(column, condition)
//         return new User(
//             manager,
//             this.toJson()
//         );
//     }

//     async all() {
//         const results = await this.manager.excute()
//         const users = results.map((userJson: UserJson) => new User(this.manager, userJson))
//         return users;
//     }

//     async first() {
//         const result = await this.manager.excute() as UserJson[]
//         return new User(this.manager, result[0]);
//     }

//     static createUser(db: Mysql, userJson: UserJson) {
//         const columns = [
//             'id',
//             'name',
//             'password',
//             'email',
//             'session',
//             'token',
//             'image',
//         ]
//         const manager = new ModelManager(db, 'users', columns)
//         return new User(manager, userJson)
//     }

//     toJson(): UserJson {
//         return {
//             id: this.id,
//             name: this.name,
//             password: this.password,
//             email: this.email,
//             session: this.session,
//             token: this.token,
//             image: this.image,
//             createdAt: this.createdAt
//         }
//     }
// }