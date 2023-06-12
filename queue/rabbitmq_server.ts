import amqp from 'amqplib'
import { MongoDB } from './mongodb';

class RabbitMQServer {

    constructor(private channel: amqp.Channel, private mongodb: MongoDB) {}

    static async createChannel(host: string | undefined, mongodb: MongoDB) {
        if(!host) {
            throw new Error('No host')
        }
        const connection = await amqp.connect(`amqp://${host}`);
        const channel = await connection.createChannel();
        return new RabbitMQServer(channel, mongodb)
    }

    async createQueue(queue: string) {
        await this.channel.assertQueue(queue, { durable: false });
        this.channel.consume(queue, (msg: any) => {
            if (msg !== null) {
                let content = msg.content.toString();
                let jsonMsg = JSON.parse(content);
                this.mongodb.insertOne(jsonMsg)
                console.log(`Received: ${jsonMsg}`);
                this.channel.ack(msg);
            }
        });
    }

}

export { RabbitMQServer }