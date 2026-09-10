import { Router } from 'express';
import { forward, services } from '../proxy.ts';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const query = req.query as Record<string, string>;
    const data = await forward(services.partners, 'get', '/partners', undefined, query);
    res.json(data);
  } catch (err) {
    console.error('[gateway] GET /api/partners →', err);
    res.status(502).json({ error: 'El servicio de aliados no está disponible' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const data = await forward(services.partners, 'get', `/partners/${req.params.id}`);
    res.json(data);
  } catch (err) {
    console.error('[gateway] GET /api/partners/:id →', err);
    res.status(502).json({ error: 'El servicio de aliados no está disponible' });
  }
});

export default router;