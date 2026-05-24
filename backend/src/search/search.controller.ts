// src/search/search.controller.ts
import { Controller, Get, Query, Inject } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { MongoClient } from 'mongodb';
import { Pool } from 'pg';
import { MONGO_CLIENT } from '../database/mongodb/mongodb.provider';
import { POSTGRES_POOL } from '../database/postgres/postgres.provider';

interface ProductoResultado {
  _id:               string;
  store_id:          string;
  title:             string;
  description?:      string;
  category?:         string;
  price:             number;
  compare_at_price?: number;
  stock:             number;
  images:            string[];
  sku:               string;
  is_active:         boolean;
  // Enriquecido con datos de la tienda
  storeName?:        string;
  storeSlug?:        string;
  storeLogo?:        string;
  storeDescription?: string;
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
    @Query('q')           q           = '',
    @Query('limit')       limitStr    = '24',
    @Query('skip')        skipStr     = '0',
    @Query('storeId')     storeId     = '',
    @Query('maxPrice')    maxPrice    = '',
    @Query('minPrice')    minPrice    = '',
    @Query('sortBy')      sortBy      = 'newest',
    @Query('hasDiscount') hasDiscount = '',
    @Query('category')    category    = '',
  ) {
    const limit   = Math.min(Number(limitStr) || 24, 100);
    const skip    = Number(skipStr) || 0;
    const termino = q.trim();

    // ── 1. Tiendas publicadas — ahora incluye description ──────────────────
    const { rows: tiendas } = await this.pool.query<{
      id: string; name: string; slug: string; logo_url: string | null; description: string | null;
    }>(
      storeId
        ? 'SELECT id, name, slug, logo_url, description FROM stores WHERE id = $1 AND is_published = true'
        : 'SELECT id, name, slug, logo_url, description FROM stores WHERE is_published = true',
      storeId ? [storeId] : [],
    );

    if (tiendas.length === 0) return { resultados: [], total: 0 };

    const mapasTiendas = new Map(tiendas.map((t) => [t.id, t]));
    const idsTiendas   = tiendas.map((t) => t.id);

    // ── 2. Filtro MongoDB ──────────────────────────────────────────────────
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

    // Filtro por categoría (match exacto sobre el slug)
    if (category) filtro.category = category;

    // Solo productos con precio rebajado (compare_at_price > price)
    if (hasDiscount === 'true') {
      filtro.$expr = { $gt: ['$compare_at_price', '$price'] };
    }

    // ── 3. Ordenamiento ────────────────────────────────────────────────────
    let sort: Record<string, 1 | -1> = { created_at: -1 }; // newest (default)
    if (termino) {
      sort = {};                        // búsqueda textual → orden natural
    } else if (sortBy === 'price_asc') {
      sort = { price: 1 };
    } else if (sortBy === 'price_desc') {
      sort = { price: -1 };
    } else if (sortBy === 'discount') {
      sort = { compare_at_price: -1 }; // mayor precio original → mayor descuento
    }

    // ── 4. Buscar en MongoDB ───────────────────────────────────────────────
    const col = this.mongo.db().collection('products');

    const [productos, total] = await Promise.all([
      col.find(filtro).sort(sort).skip(skip).limit(limit).toArray(),
      col.countDocuments(filtro),
    ]);

    // ── 5. Enriquecer con datos de tienda ──────────────────────────────────
    const resultados: ProductoResultado[] = productos.map((p) => {
      const tienda = mapasTiendas.get(p.store_id);
      return {
        _id:               String(p._id),
        store_id:          p.store_id,
        title:             p.title,
        description:       p.description,
        category:          p.category,
        price:             p.price,
        compare_at_price:  p.compare_at_price,
        stock:             p.stock,
        images:            p.images ?? [],
        sku:               p.sku,
        is_active:         p.is_active,
        storeName:         tienda?.name,
        storeSlug:         tienda?.slug,
        storeLogo:         tienda?.logo_url ?? undefined,
        storeDescription:  tienda?.description ?? undefined,
      };
    });

    return { resultados, total };
  }
}
