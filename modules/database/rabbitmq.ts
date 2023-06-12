import * as amqp from 'amqplib';
import { Table } from '../../models/table';
import { DatabaseReplayManager } from '../../models/table/table_manager/database_replay_manager';


class RabbitMQClient {

    constructor(private channel: amqp.Channel) {}

    static async createChannel(host: string) {
        const connection = await amqp.connect(`amqp://${host}`);
        const channel = await connection.createChannel();
        return new RabbitMQClient(channel)
    }

    async sendQueue(queue: string, table: Table) {
        await this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(table)));
    }

    async deleteQueue(queue: string) {
        await this.deleteQueue(queue)
    }
}


class RabbitMQServer {

    constructor(private channel: amqp.Channel, private drm: DatabaseReplayManager) {}

    static async createChannel(host: string, drm: DatabaseReplayManager) {
        const connection = await amqp.connect(`amqp://${host}`);
        const channel = await connection.createChannel();
        return new RabbitMQServer(channel, drm)
    }

    async createQueue(queue: string) {
        await this.channel.assertQueue(queue, { durable: false });
        this.channel.consume(queue, (msg) => {
            if (msg !== null) {
                let content = msg.content.toString();
                let jsonMsg = JSON.parse(content);
                this.drm.createReplayTableJson(jsonMsg)
                console.log(`Received: ${jsonMsg}`);
                this.channel.ack(msg);
            }
        });
    }

}

export { RabbitMQClient, RabbitMQServer }

