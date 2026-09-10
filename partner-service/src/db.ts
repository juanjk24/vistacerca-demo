import pg from 'pg';

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgres://vistacerca:vistacerca@localhost:5432/vistacerca';

export const pool = new pg.Pool({ connectionString: DATABASE_URL });

export async function waitForDb(retries = 30): Promise<void> {
  for (let i = 1; i <= retries; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('[partner-service] conectado a PostgreSQL');
      return;
    } catch {
      console.log(`[partner-service] esperando PostgreSQL (${i}/${retries})...`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error('No se pudo conectar a PostgreSQL');
}