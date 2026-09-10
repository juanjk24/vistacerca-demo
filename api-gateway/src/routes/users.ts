import { Router } from 'express';
import { forward, services } from '../proxy.ts';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const data = await forward(services.users, 'post', '/users', req.body);
    res.status(201).json(data);
  } catch (err) {
    console.error('[gateway] POST /api/users →', err);
    res.status(502).json({ error: 'El servicio de usuarios no está disponible' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const data = await forward(services.users, 'get', `/users/${req.params.id}`);
    res.json(data);
  } catch (err) {
    console.error('[gateway] GET /api/users/:id →', err);
    res.status(502).json({ error: 'El servicio de usuarios no está disponible' });
  }
});

export default router;