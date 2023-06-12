import { MongoClient } from "mongodb";
import { TablesJson } from "../../models/table/table_manager/table_manager";


class MongoDB {

    private client: MongoClient
    constructor(
        private host: string | undefined,
        private user: string | undefined,
        private password: string | undefined,
        private port: string | undefined,
        private database: string | undefined,
        private collection: string | any,
    ) {
        if(!host || !user || !port || !database || !collection) throw new Error('host or user or database is undefined')
        this.host = host
        this.user = user
        this.password = password
        this.port = port
        this.database = database
        this.collection = collection
        const uri = `mongodb://${this.user}:${this.password}@${this.host}:${this.port}`;
        this.client = new MongoClient(uri);
        this.client.connect();
    }

    async getAll(query: {[key: string]: string | number} = {}) {
        const database = this.client.db(this.database); // Use the name of your database
        const collection = database.collection(this.collection); // Use the name of your collection
        const documents = await collection.find(query).toArray();
        return documents
    }

    async getOne(query: {[key: string]: string | number}) {
        const database = this.client.db(this.database); // Use the name of your database
        const collection = database.collection(this.collection); // Use the name of your collection
        const result = await collection.findOne(query);
        return result
    }

    async insertOne(document: any) {
        const database = this.client.db(this.database); // Use the name of your database
        const collection = database.collection(this.collection); // Use the name of your collection
        const result = await collection.insertOne(document);
        return result
    }

    async replaceOne(query: {[key: string]: string | number}, document: any) {
        const database = this.client.db(this.database); // Use the name of your database
        const collection = database.collection(this.collection); // Use the name of your collection
        const result = await collection.replaceOne(query, document);
        return result
    }

    async deleteOne(query: {[key: string]: string | number}) {
        const database = this.client.db(this.database); // Use the name of your database
        const collection = database.collection(this.collection); // Use the name of your collection
        const result = await collection.deleteOne(query);
        return result
    }

    async deleteAll(query: {[key: string]: string | number}) {
        const database = this.client.db(this.database); // Use the name of your database
        const collection = database.collection(this.collection); // Use the name of your collection
        const result = await collection.deleteMany(query);
        return result
    }
}


export { MongoDB }