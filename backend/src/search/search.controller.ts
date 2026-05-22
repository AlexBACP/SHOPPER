// src/search/search.controller.ts
import { Controller, Get, Query, Inject } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { MongoClient } from 'mongodb';
import { Pool } from 'pg';
import { MONGO_CLIENT } from '../database/mongodb/mongodb.provider';
import { POSTGRES_POOL } from '../database/postgres/postgres.provider';

interface ProductoResultado {
  _id:          string;
  store_id:     string;
  title:        string;
  description?: string;
  price:        number;
  stock:        number;
  images:       string[];
  sku:          string;
  is_active:    boolean;
  // Enriquecido con datos de la tienda
  storeName?:   string;
  storeSlug?:   string;
  storeLogo?:   string;
}

/**
 * Endpoint de búsqueda global de productos.
 *
 * GET /products/search?q=sombrero&limit=24&skip=0&storeId=xxx&maxPrice=500000
 *
 * - Busca en MongoDB con regex sobre title, description y sku.
 * - Enriquece cada resultado con nombre y slug de la tienda (PostgreSQL).
 * - Solo incluye productos activos de tiendas publicadas.
 */
@SkipThrottle()
@Controller('products')
export class SearchController {
  constructor(
    @Inject(MONGO_CLIENT) private readonly mongo: MongoClient,
    @Inject(POSTGRES_POOL) private readonly pool:  Pool,
  ) {}

  @Get('search')
  async buscar(
    @Query('q')        q         = '',
    @Query('limit')    limitStr  = '24',
    @Query('skip')     skipStr   = '0',
    @Query('storeId')  storeId   = '',
    @Query('maxPrice') maxPrice  = '',
    @Query('minPrice') minPrice  = '',
  ) {
    const limit  = Math.min(Number(limitStr) || 24, 100);
    const skip   = Number(skipStr) || 0;
    const termino = q.trim();

    // ── 1. Obtener IDs de tiendas publicadas (desde PostgreSQL) ───────────
    const { rows: tiendas } = await this.pool.query<{
      id: string; name: string; slug: string; logo_url: string | null;
    }>(
      storeId
        ? 'SELECT id, name, slug, logo_url FROM stores WHERE id = $1 AND is_published = true'
        : 'SELECT id, name, slug, logo_url FROM stores WHERE is_published = true',
      storeId ? [storeId] : [],
    );

    if (tiendas.length === 0) return { resultados: [], total: 0 };

    const mapasTiendas = new Map(tiendas.map((t) => [t.id, t]));
    const idsTiendas   = tiendas.map((t) => t.id);

    // ── 2. Construir filtro MongoDB ───────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filtro: Record<string, any> = {
      is_active: true,
      store_id:  { $in: idsTiendas },
    };

    if (termino) {
      const regex = new RegExp(termino.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filtro.$or = [
        { title:       { $regex: regex } },
        { description: { $regex: regex } },
        { sku:         { $regex: regex } },
      ];
    }

    if (minPrice) filtro.price = { ...filtro.price, $gte: Number(minPrice) };
    if (maxPrice) filtro.price = { ...filtro.price, $lte: Number(maxPrice) };

    // ── 3. Buscar en MongoDB ──────────────────────────────────────────────
    const col = this.mongo.db().collection('products');

    const [productos, total] = await Promise.all([
      col.find(filtro)
        .sort(termino ? {} : { created_at: -1 })  // sin query → más recientes primero
        .skip(skip)
        .limit(limit)
        .toArray(),
      col.countDocuments(filtro),
    ]);

    // ── 4. Enriquecer con datos de tienda ─────────────────────────────────
    const resultados: ProductoResultado[] = productos.map((p) => {
      const tienda = mapasTiendas.get(p.store_id);
      return {
        _id:         String(p._id),
        store_id:    p.store_id,
        title:       p.title,
        description: p.description,
        price:       p.price,
        stock:       p.stock,
        images:      p.images ?? [],
        sku:         p.sku,
        is_active:   p.is_active,
        storeName:   tienda?.name,
        storeSlug:   tienda?.slug,
        storeLogo:   tienda?.logo_url ?? undefined,
      };
    });

    return { resultados, total };
  }
}
