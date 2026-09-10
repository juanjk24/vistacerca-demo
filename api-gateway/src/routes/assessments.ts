import { Router } from 'express';
import { forward, services } from '../proxy.ts';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const data = await forward(services.assessments, 'post', '/assessments', req.body);
    res.status(201).json(data);
  } catch (err) {
    console.error('[gateway] POST /api/assessments →', err);
    res.status(502).json({ error: 'El servicio de evaluaciones no está disponible' });
  }
});

router.get('/', async (_req, res) => {
  try {
    const data = await forward(services.assessments, 'get', '/assessments');
    res.json(data);
  } catch (err) {
    console.error('[gateway] GET /api/assessments →', err);
    res.status(502).json({ error: 'El servicio de evaluaciones no está disponible' });
  }
});

export default router;