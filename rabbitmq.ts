import * as amqp from 'amqplib';

async function produce() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();

  const queue = 'test_queue';
  const message = 'Hello, RabbitMQ!';

  await channel.assertQueue(queue, { durable: false });
  channel.sendToQueue(queue, Buffer.from(message));
  channel.deleteQueue(queue)
  channel.sendToQueue(queue, Buffer.from(message));
  console.log(`Sent: ${message}`);
  
  setTimeout(function() {
    connection.close();
    process.exit(0);
  }, 500);
}

produce();
