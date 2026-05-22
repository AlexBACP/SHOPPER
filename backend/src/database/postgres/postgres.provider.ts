import { Pool } from 'pg';

export const POSTGRES_POOL = 'POSTGRES_POOL';

export const postgresProvider = {
  provide: POSTGRES_POOL,
  useFactory: async (): Promise<Pool> => {
    const pool = new Pool({
      host: process.env.DB_HOST || '127.0.0.1', // 🔥 FORZAR IPv4
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER,
      password: String(process.env.DB_PASSWORD), // 🔥 asegurar string
      database: process.env.DB_NAME,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: false,
    });

    console.log('DEBUG ENV:', {
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    const client = await pool.connect();
    console.log('✅ PostgreSQL conectado');
    client.release();

    return pool;
  },
}