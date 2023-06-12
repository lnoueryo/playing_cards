import http, {IncomingMessage, ServerResponse} from 'http'
import { RabbitMQServer } from './rabbitmq_server'
import { MongoDB } from './mongodb'
require('dotenv').config();



const main = async() => {
    const host = process.env.RABBITMQ_HOST
    const mongo_host = process.env.MONGO_DB_HOST
    const mongo_user = process.env.MONGO_DB_USER
    const mongo_password = process.env.MONGO_DB_PASSWORD
    const mongo_port = process.env.MONGO_DB_PORT
    const mongo_name = process.env.MONGO_DB_NAME
    const mongo_replay_collection = process.env.MONGO_DB_REPLAY_COLLECTION
    const mongoReplay = new MongoDB(mongo_host, mongo_user, mongo_password, mongo_port, mongo_name, mongo_replay_collection)
    const rms = await RabbitMQServer.createChannel(host, mongoReplay)
    const server = http.createServer(async(req: IncomingMessage, res: ServerResponse) => {
        try {
            const table_id = await getBody(req)
            await rms.createQueue(table_id)
            res.on('finish', () => {
                res.end('OK') // レスポンスボディが「OK」になる
            });
        } catch (error) {
            console.log(error)
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Error: Not Found');
        }

    })
    server.listen(4000, () => {
        console.log('HTTP server is running on port 4000')
    }) // 4000番ポートで起動
}


const getBody = async (req: http.IncomingMessage) => {
    return new Promise<any>((resolve, reject) => {
        let body = '';
        req.on('readable', () => {
            let chunk;
            while ((chunk = req.read()) !== null) {
                body += chunk;
            }
        });

        req.on('end', () => {
            resolve(JSON.parse(body));
        });

        req.on('error', (error) => {
            reject(error);
        });
    });
}

main()