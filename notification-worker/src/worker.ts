import amqplib from 'amqplib';

const AMQP_URL = process.env.AMQP_URL ?? 'amqp://guest:guest@localhost:5672';
const EXCHANGE = 'vistacerca.events';
const WORKER_ID = process.env.WORKER_ID ?? 'notification-1';
const BINDING_KEYS = ['assessment.completed', 'appointment.created', 'appointment.updated'];

interface EventMessage {
  event: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

function formatNotification(data: EventMessage): string {
  const p = data.payload;
  switch (data.event) {
    case 'assessment.completed':
      return `[NOTIFICATION] Evaluación ${p.assessmentId ?? '?'} del usuario ${p.userId ?? '?'}: resultado ${p.result ?? '?'}. Te contactaremos con aliados cercanos.`;
    case 'appointment.created':
      return `[NOTIFICATION] Cita ${p.appointmentId ?? '?'} creada para el usuario ${p.userId ?? '?'} con el aliado ${p.partnerId ?? '?'} (fecha ${p.date ?? '?'}).`;
    case 'appointment.updated':
      return `[NOTIFICATION] Cita ${p.appointmentId ?? '?'} del usuario ${p.userId ?? '?'} cambió a estado ${p.status ?? '?'}.`;
    default:
      return `[NOTIFICATION] Evento ${data.event}`;
  }
}

async function processMessage(data: EventMessage): Promise<void> {
  console.log(`[${WORKER_ID}] procesando ${data.event}...`);
  await new Promise((r) => setTimeout(r, 120 + Math.random() * 200));
  console.log(formatNotification(data));
}

let retries = 20;
while (retries > 0) {
  try {
    const conn = await amqplib.connect(AMQP_URL);
    const ch = await conn.createChannel();
    await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
    const q = await ch.assertQueue(`notification.queue`, { durable: true });
    for (const key of BINDING_KEYS) {
      await ch.bindQueue(q.queue, EXCHANGE, key);
    }
    ch.prefetch(1);
    console.log(`[${WORKER_ID}] escuchando ${BINDING_KEYS.join(', ')} → cola ${q.queue}`);

    await ch.consume(q.queue, async (msg) => {
      if (!msg) return;
      try {
        const data = JSON.parse(msg.content.toString()) as EventMessage;
        await processMessage(data);
        ch.ack(msg);
      } catch (err) {
        console.error(`[${WORKER_ID}] error procesando mensaje`, err);
        ch.ack(msg);
      }
    });
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