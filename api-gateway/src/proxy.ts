import axios, { type Method } from 'axios';

export const services = {
  users: process.env.USER_SERVICE_URL ?? 'http://localhost:3001',
  assessments: process.env.ASSESSMENT_SERVICE_URL ?? 'http://localhost:3002',
  partners: process.env.PARTNER_SERVICE_URL ?? 'http://localhost:3003',
  appointments: process.env.APPOINTMENT_SERVICE_URL ?? 'http://localhost:3004',
};

/** Reenvía la petición al microservicio destino (patrón Proxy). */
export async function forward(
  serviceUrl: string,
  method: Method,
  path: string,
  body?: unknown,
  query?: Record<string, string>,
): Promise<unknown> {
  const { data } = await axios.request({
    method,
    url: `${serviceUrl}${path}`,
    data: body,
    params: query,
    timeout: 8000,
  });
  return data;
}

export async function ping(serviceUrl: string, timeout = 2500): Promise<boolean> {
  try {
    await axios.get(`${serviceUrl}/health`, { timeout });
    return true;
  } catch {
    return false;
  }
}