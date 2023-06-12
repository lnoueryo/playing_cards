import { config } from "../../main"
const bcrypt = require('bcryptjs');
import { ModelBase } from "./base"


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

    constructor(id: number, name: string, password: string, email: string, image: string, created_at: string = '', updated_at: string = '') {
        super(created_at, updated_at)
        this.id = id;
        this.name = name;
        this.password = password;
        this.email = email;
        this.image = image;
    }
    async hashPassword(password: string): Promise<string> {
        try {
            const saltRounds = 10; // ハッシュ化のコストパラメーター
            const salt = await bcrypt.genSalt(saltRounds);
            const hashedPassword = await bcrypt.hash(password, salt);
            return hashedPassword;
        } catch (error) {
            console.error(error)
            return '';
        }
    }

    async isPasswordCorrect(password: string): Promise<boolean> {
        return await bcrypt.compare(password, this.password);
    }

    static async findByEmail(email: string): Promise<User | null> {
        try {
            const cfg = await config;
            const rows = await cfg.DB.query('SELECT * FROM users WHERE email = ?', [email]) as any
            if (!Array.isArray(rows) || rows.length === 0) {
                console.warn(new Error('No record by: ' + email));
                return null;
            }
    
            const {id, name, password, image } = rows[0] as User;
            return new User(id, name, password, email, image);
        } catch (error) {
            console.error(error)
            return null
        }
    }

    static async create(name: string, password: string, email: string, image: string): Promise<User | null> {
        try {
            const cfg = await config;
            const hashedPassword = await bcrypt.hash(password, 10);
            const result = await cfg.DB.query('INSERT INTO users (name, password, email, image) VALUES (?, ?, ?, ?)', [name, hashedPassword, email, image || '']);
            const id = result.insertId;
            return new User(id, name, hashedPassword, email, image);
        } catch (error) {
            console.error(error)
            return null
        }
    }

    async update(data: Partial<User>): Promise<User | null> {

        try {
            const cfg = await config;
            // Update only the fields provided in `data`
            const entries = Object.entries(data);
            const updates = entries.map(([key, value]) => `${key} = ?`).join(', ');
            const values = entries.map(([_, value]) => value);
    
            cfg.DB.query(`UPDATE users SET ${updates} WHERE id = ?`, [...values, this.id]);
    
            // Create a new User instance with the updated data
            const updatedUser = { ...this, ...data };
            return new User(updatedUser.id, updatedUser.name, updatedUser.password, updatedUser.email, updatedUser.image, updatedUser.created_at, updatedUser.updated_at);
        } catch (error) {
            console.error(error)
            return null
        }

      }

}
export { User }
