import express from 'express';
import { pool, waitForDb } from './db.ts';
import { connectEvents, publishEvent } from './events.ts';
import { classifyAssessment } from './rules/classification.ts';

const PORT = Number(process.env.PORT ?? 3002);
const app = express();
app.use(express.json());

await Promise.all([waitForDb(), connectEvents()]);

app.get('/health', (_req, res) => {
  res.json({ service: 'assessment-service', status: 'ok' });
});

app.post('/assessments', async (req, res) => {
  try {
    const {
      userId,
      blurVision = false,
      eyeBurning = false,
      persistentSymptoms = false,
      highScreenTime = false,
    } = req.body ?? {};

    if (!userId) {
      res.status(400).json({ error: 'userId es obligatorio' });
      return;
    }

    const symptoms = {
      blurVision: Boolean(blurVision),
      eyeBurning: Boolean(eyeBurning),
      persistentSymptoms: Boolean(persistentSymptoms),
      highScreenTime: Boolean(highScreenTime),
    };

    const result = classifyAssessment(symptoms);

    const { rows } = await pool.query(
      `INSERT INTO assessments (user_id, result, blur_vision, eye_burning, persistent_symptoms, high_screen_time)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, result, created_at`,
      [
        userId,
        result,
        symptoms.blurVision,
        symptoms.eyeBurning,
        symptoms.persistentSymptoms,
        symptoms.highScreenTime,
      ],
    );

    await publishEvent('assessment.completed', {
      assessmentId: rows[0].id,
      userId,
      result,
    });

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[assessment-service] error creando evaluación', err);
    res.status(500).json({ error: 'error interno del servidor' });
  }
});

app.get('/assessments', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.id, a.user_id, a.result, a.blur_vision, a.eye_burning,
              a.persistent_symptoms, a.high_screen_time, a.created_at, u.name AS user_name
       FROM assessments a
       JOIN users u ON u.id = a.user_id
       ORDER BY a.id DESC`,
    );
    res.json(rows);
  } catch (err) {
    console.error('[assessment-service] error listando evaluaciones', err);
    res.status(500).json({ error: 'error interno del servidor' });
  }
});

app.get('/metrics', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT key, value FROM analytics ORDER BY key',
    );
    res.json({ metrics: rows });
  } catch (err) {
    console.error('[assessment-service] error consultando métricas', err);
    res.status(500).json({ error: 'error interno del servidor' });
  }
});

app.listen(PORT, () => {
  console.log(`[assessment-service] escuchando en http://localhost:${PORT}`);
});