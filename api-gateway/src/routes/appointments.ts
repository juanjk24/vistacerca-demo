import { Router } from 'express';
import { forward, services } from '../proxy.ts';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const data = await forward(services.appointments, 'post', '/appointments', req.body);
    res.status(201).json(data);
  } catch (err) {
    console.error('[gateway] POST /api/appointments →', err);
    res.status(502).json({ error: 'El servicio de citas no está disponible' });
  }
});

router.get('/', async (req, res) => {
  try {
    const query = req.query as Record<string, string>;
    const data = await forward(services.appointments, 'get', '/appointments', undefined, query);
    res.json(data);
  } catch (err) {
    console.error('[gateway] GET /api/appointments →', err);
    res.status(502).json({ error: 'El servicio de citas no está disponible' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const data = await forward(services.appointments, 'get', `/appointments/${req.params.id}`);
    res.json(data);
  } catch (err) {
    console.error('[gateway] GET /api/appointments/:id →', err);
    res.status(502).json({ error: 'El servicio de citas no está disponible' });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const data = await forward(
      services.appointments,
      'patch',
      `/appointments/${req.params.id}/status`,
      req.body,
    );
    res.json(data);
  } catch (err) {
    console.error('[gateway] PATCH /api/appointments/:id/status →', err);
    res.status(502).json({ error: 'El servicio de citas no está disponible' });
  }
});

export default router;