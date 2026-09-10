import express from 'express';
import { pool, waitForDb } from './db.ts';

const PORT = Number(process.env.PORT ?? 3001);
const app = express();
app.use(express.json());

await waitForDb();

app.get('/health', (_req, res) => {
  res.json({ service: 'user-service', status: 'ok' });
});

app.post('/users', async (req, res) => {
  try {
    const { name, age, city } = req.body ?? {};
    if (!name) {
      res.status(400).json({ error: 'name es obligatorio' });
      return;
    }
    const { rows } = await pool.query(
      `INSERT INTO users (name, age, city)
       VALUES ($1, $2, $3)
       RETURNING id, name, age, city, created_at`,
      [String(name), Number.isFinite(age) ? Number(age) : null, city || null],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[user-service] error creando usuario', err);
    res.status(500).json({ error: 'error interno del servidor' });
  }
});

app.get('/users/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, age, city, created_at FROM users WHERE id = $1',
      [req.params.id],
    );
    if (!rows[0]) {
      res.status(404).json({ error: 'usuario no encontrado' });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('[user-service] error consultando usuario', err);
    res.status(500).json({ error: 'error interno del servidor' });
  }
});

app.listen(PORT, () => {
  console.log(`[user-service] escuchando en http://localhost:${PORT}`);
});