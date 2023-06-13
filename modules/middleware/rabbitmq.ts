import * as amqp from 'amqplib';
import { Table } from '../../models/table';
import axios from 'axios';


class RabbitMQClient {

    constructor(private channel: amqp.Channel, private consumerHost: string, private port: string) {}

    static async createChannel(host: string, consumerHost: string, port: string) {
        const connection = await amqp.connect(`amqp://${host}`);
        const channel = await connection.createChannel();
        return new RabbitMQClient(channel, consumerHost, port)
    }

    async createQueue(queue: string) {
        const url = `http://${this.consumerHost}:${this.port}`;
        const data = {
            table_id: queue,
        };

        return await axios.post(url, data);
    }

    async sendQueue(table: Table) {
        return await this.channel.sendToQueue(table.id, Buffer.from(JSON.stringify(table)));
    }

    async deleteQueue(queue: string) {
        return await this.channel.deleteQueue(queue)
    }
}

export { RabbitMQClient }

