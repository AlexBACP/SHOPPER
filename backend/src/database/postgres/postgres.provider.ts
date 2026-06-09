import { Pool, types } from 'pg';

// Por defecto, node-postgres devuelve las columnas NUMERIC/DECIMAL (OID 1700)
// como STRING para no perder precisión. En esta app los montos (total, price,
// shipping_cost…) son COP sin decimales relevantes, así que los parseamos a
// número globalmente. Evita bugs de concatenación tipo "0" + "236810.00".
types.setTypeParser(1700, (val) => (val === null ? null : parseFloat(val)));

export const POSTGRES_POOL = 'POSTGRES_POOL';

export const postgresProvider = {
  provide: POSTGRES_POOL,
  useFactory: async (): Promise<Pool> => {
    const pool = new Pool({
      host: process.env.DB_HOST || '127.0.0.1', // FORZAR IPv4
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER,
      password: String(process.env.DB_PASSWORD), // asegurar string
      database: process.env.DB_NAME,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: false,
    });

    const client = await pool.connect();
    console.log(' PostgreSQL conectado');
    client.release();

    return pool;
  },
}