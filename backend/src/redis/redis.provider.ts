import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const redisProvider = {
  provide: REDIS_CLIENT,
  useFactory: (): Redis => {
    const client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    });
    client.on('connect', () => console.log(' Redis conectado'));
    client.on('error', (err) => console.error(' Redis error:', err));
    return client;
  },
};