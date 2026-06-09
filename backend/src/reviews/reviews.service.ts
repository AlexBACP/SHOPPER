import {
  Injectable, Inject, NotFoundException,
  ConflictException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { Pool }                from 'pg';
import { MongoClient, ObjectId } from 'mongodb';
import { POSTGRES_POOL } from '../database/postgres/postgres.provider';
import { MONGO_CLIENT }  from '../database/mongodb/mongodb.provider';

export interface Resena {
  id:         string;
  product_id: string;
  user_id:    string;
  user_name:  string;
  rating:     number;
  comment:    string | null;
  image:      string | null;
  created_at: string;
}

export interface ResumenResenas {
  promedio:    number;
  total:       number;
  por_estrella: Record<1|2|3|4|5, number>;
}

@Injectable()
export class ReviewsService {
  constructor(
    @Inject(POSTGRES_POOL) private readonly pool:  Pool,
    @Inject(MONGO_CLIENT)  private readonly mongo: MongoClient,
  ) {}

  private get products() {
    return this.mongo.db().collection('products');
  }

  async crear(
    userId:    string,
    productId: string,
    rating:    number,
    comment?:  string,
    image?:    string,
  ): Promise<Resena> {
    // Validar que el producto existe en MongoDB
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(productId);
    } catch {
      throw new BadRequestException('product_id inválido');
    }
    const product = await this.products.findOne({ _id: objectId, is_active: true });
    if (!product) throw new NotFoundException('Producto no encontrado o inactivo');

    // Verificar que el usuario REALMENTE compró el producto (reseñas verificadas).
    // Solo cuentan órdenes pagadas/en curso (no 'pending' ni 'cancelled'/'refunded').
    const { rows: compra } = await this.pool.query(
      `SELECT 1
         FROM orders o
         JOIN order_items oi ON oi.order_id = o.id
        WHERE o.buyer_id = $1
          AND oi.product_id = $2
          AND o.status IN ('confirmed','processing','shipped','delivered')
        LIMIT 1`,
      [userId, productId],
    );
    if (compra.length === 0) {
      throw new ForbiddenException('Solo puedes reseñar productos que has comprado');
    }

    // Evitar reseña duplicada
    const { rows: existing } = await this.pool.query(
      'SELECT id FROM reviews WHERE product_id = $1 AND user_id = $2',
      [productId, userId],
    );
    if (existing.length > 0) {
      throw new ConflictException('Ya has dejado una reseña para este producto');
    }

    const { rows } = await this.pool.query<Resena>(
      `INSERT INTO reviews (product_id, user_id, rating, comment, image)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, product_id, user_id, rating, comment, image, created_at`,
      [productId, userId, rating, comment ?? null, image ?? null],
    );

    const { rows: user } = await this.pool.query<{ name: string }>(
      'SELECT name FROM users WHERE id = $1',
      [userId],
    );

    return { ...rows[0], user_name: user[0]?.name ?? 'Usuario' };
  }

  async obtenerPorProducto(productId: string): Promise<Resena[]> {
    const { rows } = await this.pool.query<Resena>(
      `SELECT r.id, r.product_id, r.user_id, r.rating, r.comment, r.image,
              r.created_at, u.name AS user_name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.product_id = $1
       ORDER BY (r.image IS NOT NULL) DESC, r.created_at DESC
       LIMIT 100`,
      [productId],
    );
    return rows;
  }

  async resumen(productId: string): Promise<ResumenResenas> {
    const { rows } = await this.pool.query<{ rating: string; count: string }>(
      `SELECT rating, COUNT(*) AS count
       FROM reviews
       WHERE product_id = $1
       GROUP BY rating`,
      [productId],
    );

    const porEstrella: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let suma = 0;
    let total = 0;

    for (const row of rows) {
      const r = Number(row.rating);
      const c = Number(row.count);
      porEstrella[r] = c;
      suma  += r * c;
      total += c;
    }

    return {
      promedio:     total > 0 ? Math.round((suma / total) * 10) / 10 : 0,
      total,
      por_estrella: porEstrella as Record<1|2|3|4|5, number>,
    };
  }

  async eliminar(id: string, userId: string): Promise<void> {
    const { rows } = await this.pool.query(
      'SELECT user_id FROM reviews WHERE id = $1',
      [id],
    );
    if (!rows[0]) throw new NotFoundException('Reseña no encontrada');
    if (rows[0].user_id !== userId) throw new ForbiddenException('No puedes eliminar esta reseña');
    await this.pool.query('DELETE FROM reviews WHERE id = $1', [id]);
  }

  async resenaDelUsuario(productId: string, userId: string): Promise<Resena | null> {
    const { rows } = await this.pool.query<Resena>(
      `SELECT r.id, r.product_id, r.user_id, r.rating, r.comment, r.image,
              r.created_at, u.name AS user_name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.product_id = $1 AND r.user_id = $2`,
      [productId, userId],
    );
    return rows[0] ?? null;
  }

  /** Reputación agregada de una tienda: promedio y total de todas sus reseñas. */
  async resumenTienda(storeId: string): Promise<{ promedio: number; total: number }> {
    // IDs de los productos de la tienda (viven en MongoDB)
    const prods = await this.products
      .find({ store_id: storeId })
      .project({ _id: 1 })
      .toArray();
    const ids = prods.map((p) => p._id.toString());
    if (ids.length === 0) return { promedio: 0, total: 0 };

    const { rows } = await this.pool.query<{ avg: string | null; total: string }>(
      `SELECT AVG(rating)::float AS avg, COUNT(*) AS total
       FROM reviews WHERE product_id = ANY($1)`,
      [ids],
    );
    const total = Number(rows[0]?.total ?? 0);
    const avg   = Number(rows[0]?.avg ?? 0);
    return { promedio: total > 0 ? Math.round(avg * 10) / 10 : 0, total };
  }
}
