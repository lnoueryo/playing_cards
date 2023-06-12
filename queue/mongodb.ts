import { MongoClient } from "mongodb";


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

}


export { MongoDB }