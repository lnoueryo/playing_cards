import { config } from "../../main"
const bcrypt = require('bcryptjs');
import { ModelBase } from "./model_manager"


interface User {
    id: number
    name: string
    password: string
    email: string
    image: string
}

class User extends ModelBase implements User {
    public id: number
    public name: string
    public password: string
    public email: string
    public image: string

    constructor(id: number, name: string, password: string, email: string, image: string, created_at: string, updated_at: string) {
        super(created_at, updated_at)
        this.id = id;
        this.name = name;
        this.password = password;
        this.email = email;
        this.image = image;
    }
    a(a: string) {
        // this[a] =
    }

    async hashPassword(password: string): Promise<string> {
        const saltRounds = 10; // ハッシュ化のコストパラメーター
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    }

    async comparePassword(password: string): Promise<boolean> {
        return await bcrypt.compare(password, this.password);
    }

    static async findByEmail(email: string): Promise<User | null> {
        const [rows] = await config.DB.query('SELECT * FROM users WHERE email = ?', [email])

        if (!Array.isArray(rows) || rows.length === 0) {
          return null;
        }

        const user = rows[0];
        return new User(user.id, user.name, user.password, user.email, user.session, user.token, user.image);
    }

    static async create(name: string, password: string, email: string, session: string, token: string, image: string): Promise<User> {
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await config.DB.query('INSERT INTO users (name, password, email, image) VALUES (?, ?, ?, ?, ?, ?)', [name, hashedPassword, email, image]);

        const id = result.insertId;
        return new User(id, name, hashedPassword, email, session, token, image);
    }

    async update(data: Partial<User>): Promise<User> {
        // Update only the fields provided in `data`
        const entries = Object.entries(data);
        const updates = entries.map(([key, value]) => `${key} = ?`).join(', ');
        const values = entries.map(([_, value]) => value);

        config.DB.query(`UPDATE users SET ${updates} WHERE id = ?`, [...values, this.id]);

        // Create a new User instance with the updated data
        const updatedUser = { ...this, ...data };
        return new User(updatedUser.id, updatedUser.name, updatedUser.password, updatedUser.email, updatedUser.image, updatedUser.created_at, updatedUser.updated_at);
      }

}
export { User }

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