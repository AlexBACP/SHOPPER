// src/stats/stats.controller.ts
import { Controller, Get, Inject } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Pool } from 'pg';
import { MongoClient } from 'mongodb';
import { POSTGRES_POOL } from '../database/postgres/postgres.provider';
import { MONGO_CLIENT }  from '../database/mongodb/mongodb.provider';

export interface EstadisticasPublicas {
  tiendas:    number;
  productos:  number;
  compradores: number;
  satisfaccion: number;
}

/**
 * Endpoint público de estadísticas globales de la plataforma.
 * Usado en la home para reemplazar los números hardcoded.
 */
@SkipThrottle()
@Controller('stats')
export class StatsController {
  constructor(
    @Inject(POSTGRES_POOL) private readonly pool:  Pool,
    @Inject(MONGO_CLIENT)  private readonly mongo: MongoClient,
  ) {}

  @Get()
  async obtenerEstadisticas(): Promise<EstadisticasPublicas> {
    const [tiendas, compradores, productos] = await Promise.all([
      // Tiendas publicadas
      this.pool.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM stores WHERE is_published = true`,
      ).then((r) => parseInt(r.rows[0].count, 10)),

      // Compradores (role = 'buyer')
      this.pool.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM users WHERE role = 'buyer'`,
      ).then((r) => parseInt(r.rows[0].count, 10)),

      // Productos activos en MongoDB
      this.mongo.db().collection('products')
        .countDocuments({ is_active: true })
        .catch(() => 0),
    ]);

    return {
      tiendas:      tiendas,
      productos:    productos,
      compradores:  compradores,
      satisfaccion: 98,   // KPI fijo hasta tener sistema de reseñas
    };
  }
}
