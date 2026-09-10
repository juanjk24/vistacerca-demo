import amqplib from 'amqplib';
import type { Channel, ChannelModel } from 'amqplib';

const AMQP_URL = process.env.AMQP_URL ?? 'amqp://guest:guest@localhost:5672';
export const EXCHANGE = 'vistacerca.events';

let conn: ChannelModel;
let ch: Channel;

export async function connectEvents(retries = 20): Promise<void> {
  for (let i = 1; i <= retries; i++) {
    try {
      conn = await amqplib.connect(AMQP_URL);
      ch = await conn.createChannel();
      await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
      console.log('[assessment-service] publicador RabbitMQ listo');
      return;
    } catch {
      console.log(`[assessment-service] esperando RabbitMQ (${i}/${retries})...`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  throw new Error('No se pudo conectar a RabbitMQ');
}

export async function publishEvent(key: string, payload: unknown): Promise<void> {
  const message = JSON.stringify({
    event: key,
    payload,
    timestamp: new Date().toISOString(),
  });
  ch.publish(EXCHANGE, key, Buffer.from(message), { persistent: true });
  console.log(`[assessment-service] publicado evento ${key}`);
}