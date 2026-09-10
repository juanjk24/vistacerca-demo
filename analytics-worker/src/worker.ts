import amqplib from 'amqplib';
import { pool, waitForDb } from './db.ts';

const AMQP_URL = process.env.AMQP_URL ?? 'amqp://guest:guest@localhost:5672';
const EXCHANGE = 'vistacerca.events';
const WORKER_ID = process.env.WORKER_ID ?? 'analytics-1';
const BINDING_KEYS = ['assessment.completed', 'appointment.created', 'appointment.updated'];

const inMemory: Record<string, number> = {};

function keyFor(data: { event: string; payload: Record<string, unknown> }): string | null {
  const p = data.payload;
  switch (data.event) {
    case 'assessment.completed':
      return `assessments.${String(p.result ?? 'unknown')}`;
    case 'appointment.created':
      return 'appointments.PENDING';
    case 'appointment.updated':
      return `appointments.${String(p.status ?? 'unknown')}`;
    default:
      return null;
  }
}

async function upsert(key: string): Promise<void> {
  await pool.query(
    `INSERT INTO analytics (key, value) VALUES ($1, 1)
     ON CONFLICT (key) DO UPDATE SET value = analytics.value + 1`,
    [key],
  );
  inMemory[key] = (inMemory[key] ?? 0) + 1;
}

function printSummary(): void {
  console.log(`\n[${WORKER_ID}][ANALYTICS] cuenta acumulada en memoria:`);
  for (const [k, v] of Object.entries(inMemory)) {
    console.log(`   ${k}: ${v}`);
  }
  console.log('');
}

await waitForDb();

let retries = 20;
while (retries > 0) {
  try {
    const conn = await amqplib.connect(AMQP_URL);
    const ch = await conn.createChannel();
    await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
    const q = await ch.assertQueue(`analytics.queue`, { durable: true });
    for (const key of BINDING_KEYS) {
      await ch.bindQueue(q.queue, EXCHANGE, key);
    }
    ch.prefetch(1);
    console.log(`[${WORKER_ID}] escuchando ${BINDING_KEYS.join(', ')} → cola ${q.queue}`);

    await ch.consume(q.queue, async (msg) => {
      if (!msg) return;
      try {
        const data = JSON.parse(msg.content.toString()) as {
          event: string;
          payload: Record<string, unknown>;
        };
        const key = keyFor(data);
        if (key) {
          await Promise.all([upsert(key), new Promise((r) => setTimeout(r, 100))]);
          console.log(`[${WORKER_ID}] contador ${key} actualizado`);
        }
        ch.ack(msg);
      } catch (err) {
        console.error(`[${WORKER_ID}] error procesando mensaje`, err);
        ch.ack(msg);
      }
    });

    setInterval(printSummary, 30000);
    break;
  } catch {
    retries -= 1;
    console.log(`[${WORKER_ID}] esperando RabbitMQ (reintento ${20 - retries}/20)...`);
    await new Promise((r) => setTimeout(r, 3000));
  }
}

process.on('SIGTERM', () => {
  console.log(`[${WORKER_ID}] deteniendo...`);
  process.exit(0);
});