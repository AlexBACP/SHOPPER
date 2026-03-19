//src/database/postgres/postgres.provider.ts
import { Pool } from 'pg';

export const POSTGRES_POOL = 'POSTGRES_POOL';

export const postgresProvider = {
  provide: POSTGRES_POOL,
  useFactory: async (): Promise<Pool> => {
    const pool = new Pool({
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT) || 5432,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: false,
    });

    const client = await pool.connect();
    console.log('✅ PostgreSQL conectado');
    client.release();

    return pool;
  },
};