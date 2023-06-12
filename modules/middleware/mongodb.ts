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
        try {
            const database = this.client.db(this.database); // Use the name of your database
            const collection = database.collection(this.collection); // Use the name of your collection
            const documents = await collection.find(query).toArray();
            return documents
            console.log(documents);
        } catch (error) {
            console.error(error)
        }
    }

    async getOne(query: {[key: string]: string | number}) {
        try {
            const database = this.client.db(this.database); // Use the name of your database
            const collection = database.collection(this.collection); // Use the name of your collection
            const result = await collection.findOne(query);
            console.log(`${result}`);
            return result
        } catch (error) {
            console.error(error)
        }
    }

    async insertOne(document: any) {
        try {
            const database = this.client.db(this.database); // Use the name of your database
            const collection = database.collection(this.collection); // Use the name of your collection
            const result = await collection.insertOne(document);
            console.log(`Document inserted with _id: ${result.insertedId}`);
            return result
        } catch (error) {
            console.error(error)
        }
    }

    async replaceOne(query: {[key: string]: string | number}, document: any) {
        try {
            const database = this.client.db(this.database); // Use the name of your database
            const collection = database.collection(this.collection); // Use the name of your collection
            const result = await collection.replaceOne(query, document);
            console.log(`Document inserted with _id: ${result}`);
            return result

        } catch (error) {
            console.error(error)
        }
    }

    async deleteOne(query: {[key: string]: string | number}) {
        try {
            const database = this.client.db(this.database); // Use the name of your database
            const collection = database.collection(this.collection); // Use the name of your collection
            const result = await collection.deleteOne(query);
            console.log(`Document inserted with _id: ${result.deletedCount}`);
            return result
        } catch (error) {
            console.error(error)
        }
    }

    async deleteAll(query: {[key: string]: string | number}) {
        try {
            const database = this.client.db(this.database); // Use the name of your database
            const collection = database.collection(this.collection); // Use the name of your collection
            const result = await collection.deleteMany(query);
            console.log(result.deletedCount);  // 削除されたドキュメントの数を出力
            console.log(`Document inserted with _id: ${result.deletedCount}`);
        } catch (error) {
            console.error(error)
        }
    }
}


export { MongoDB }