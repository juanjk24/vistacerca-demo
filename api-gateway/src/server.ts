import express from 'express';
import cors from 'cors';
import { ping, services } from './proxy.ts';
import usersRouter from './routes/users.ts';
import assessmentsRouter from './routes/assessments.ts';
import partnersRouter from './routes/partners.ts';
import appointmentsRouter from './routes/appointments.ts';
import metricsRouter from './routes/metrics.ts';

const PORT = Number(process.env.PORT ?? 3000);
const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', async (_req, res) => {
  const names: Record<string, string> = {
    'user-service': services.users,
    'assessment-service': services.assessments,
    'partner-service': services.partners,
    'appointment-service': services.appointments,
  };
  const entries = await Promise.all(
    Object.entries(names).map(async ([name, url]) => [name, (await ping(url)) ? 'up' : 'down']),
  );
  const status = Object.fromEntries(entries);
  const allUp = Object.values(status).every((s) => s === 'up');
  res.status(allUp ? 200 : 503).json({ gateway: 'up', ...status });
});

app.use('/api/users', usersRouter);
app.use('/api/assessments', assessmentsRouter);
app.use('/api/partners', partnersRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/metrics', metricsRouter);

app.get('/api', (_req, res) => {
  res.json({
    name: 'VistaCerca API Gateway',
    endpoints: [
      '/api/users',
      '/api/assessments',
      '/api/partners',
      '/api/appointments',
      '/api/metrics',
      '/health',
    ],
  });
});

app.listen(PORT, () => {
  console.log(`[api-gateway] escuchando en http://localhost:${PORT}`);
});