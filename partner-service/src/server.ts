import express from 'express';
import { pool, waitForDb } from './db.ts';

const PORT = Number(process.env.PORT ?? 3003);
const app = express();
app.use(express.json());

await waitForDb();

app.get('/health', (_req, res) => {
  res.json({ service: 'partner-service', status: 'ok' });
});

app.get('/partners', async (req, res) => {
  try {
    const { city } = req.query;
    const params: unknown[] = [];
    let sql = 'SELECT id, name, type, city FROM partners';
    if (city) {
      params.push(city);
      sql += ' WHERE lower(city) = lower($1)';
    }
    sql += ' ORDER BY id';
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('[partner-service] error listando aliados', err);
    res.status(500).json({ error: 'error interno del servidor' });
  }
});

app.get('/partners/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, type, city FROM partners WHERE id = $1',
      [req.params.id],
    );
    if (!rows[0]) {
      res.status(404).json({ error: 'aliado no encontrado' });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('[partner-service] error consultando aliado', err);
    res.status(500).json({ error: 'error interno del servidor' });
  }
});

app.listen(PORT, () => {
  console.log(`[partner-service] escuchando en http://localhost:${PORT}`);
});