import express from 'express';
import { pool, waitForDb } from './db.ts';
import { connectEvents, publishEvent, STATUSES, type Status } from './events.ts';

const PORT = Number(process.env.PORT ?? 3004);
const app = express();
app.use(express.json());

await Promise.all([waitForDb(), connectEvents()]);

app.get('/health', (_req, res) => {
  res.json({ service: 'appointment-service', status: 'ok' });
});

app.post('/appointments', async (req, res) => {
  try {
    const { userId, partnerId, date } = req.body ?? {};
    if (!userId || !partnerId || !date) {
      res.status(400).json({ error: 'userId, partnerId y date son obligatorios' });
      return;
    }

    const user = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (!user.rows[0]) {
      res.status(404).json({ error: 'usuario no encontrado' });
      return;
    }
    const partner = await pool.query('SELECT id FROM partners WHERE id = $1', [partnerId]);
    if (!partner.rows[0]) {
      res.status(404).json({ error: 'aliado no encontrado' });
      return;
    }

    const { rows } = await pool.query(
      `INSERT INTO appointments (user_id, partner_id, date, status)
       VALUES ($1, $2, $3, 'PENDING')
       RETURNING id, user_id, partner_id, date, status, created_at`,
      [userId, partnerId, date],
    );

    await publishEvent('appointment.created', {
      appointmentId: rows[0].id,
      userId,
      partnerId,
      date,
      status: 'PENDING',
    });

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[appointment-service] error creando cita', err);
    res.status(500).json({ error: 'error interno del servidor' });
  }
});

app.get('/appointments', async (req, res) => {
  try {
    const { userId } = req.query;
    const params: unknown[] = [];
    let sql = `SELECT a.id, a.user_id, a.partner_id, a.date, a.status, a.created_at,
                      u.name AS user_name, p.name AS partner_name
               FROM appointments a
               JOIN users u ON u.id = a.user_id
               JOIN partners p ON p.id = a.partner_id`;
    if (userId) {
      params.push(userId);
      sql += ' WHERE a.user_id = $1';
    }
    sql += ' ORDER BY a.id DESC';
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('[appointment-service] error listando citas', err);
    res.status(500).json({ error: 'error interno del servidor' });
  }
});

app.get('/appointments/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.id, a.user_id, a.partner_id, a.date, a.status, a.created_at,
              u.name AS user_name, p.name AS partner_name
       FROM appointments a
       JOIN users u ON u.id = a.user_id
       JOIN partners p ON p.id = a.partner_id
       WHERE a.id = $1`,
      [req.params.id],
    );
    if (!rows[0]) {
      res.status(404).json({ error: 'cita no encontrada' });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('[appointment-service] error consultando cita', err);
    res.status(500).json({ error: 'error interno del servidor' });
  }
});

app.patch('/appointments/:id/status', async (req, res) => {
  try {
    const { status } = req.body ?? {};
    if (!status || !STATUSES.includes(status as Status)) {
      res.status(400).json({ error: `status inválido. Válidos: ${STATUSES.join(', ')}` });
      return;
    }

    const found = await pool.query(
      'SELECT id, user_id, partner_id, date, status FROM appointments WHERE id = $1',
      [req.params.id],
    );
    if (!found.rows[0]) {
      res.status(404).json({ error: 'cita no encontrada' });
      return;
    }

    const { rows } = await pool.query(
      `UPDATE appointments SET status = $1
       WHERE id = $2
       RETURNING id, user_id, partner_id, date, status`,
      [status, req.params.id],
    );

    await publishEvent('appointment.updated', {
      appointmentId: rows[0].id,
      userId: rows[0].user_id,
      partnerId: rows[0].partner_id,
      date: rows[0].date,
      status: rows[0].status,
    });

    res.json(rows[0]);
  } catch (err) {
    console.error('[appointment-service] error actualizando cita', err);
    res.status(500).json({ error: 'error interno del servidor' });
  }
});

app.listen(PORT, () => {
  console.log(`[appointment-service] escuchando en http://localhost:${PORT}`);
});