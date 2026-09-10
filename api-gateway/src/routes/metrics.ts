import { Router } from 'express';
import { forward, services } from '../proxy.ts';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const data = await forward(services.assessments, 'get', '/metrics');
    res.json(data);
  } catch (err) {
    console.error('[gateway] GET /api/metrics →', err);
    res.status(502).json({ error: 'Métricas no disponibles' });
  }
});

export default router;