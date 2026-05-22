// src/reviews/reviews.service.ts
import {
  Injectable, Inject, NotFoundException,
  ConflictException, ForbiddenException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { POSTGRES_POOL } from '../database/postgres/postgres.provider';

export interface Resena {
  id:          string;
  product_id:  string;
  user_id:     string;
  user_name:   string;
  rating:      number;
  comment:     string | null;
  created_at:  string;
}

export interface ResumenResenas {
  promedio: number;  // 0–5, 1 decimal
  total:    number;
  por_estrella: Record<1|2|3|4|5, number>; // cantidad por cada estrella
}

@Injectable()
export class ReviewsService {
  constructor(
    @Inject(POSTGRES_POOL) private readonly pool: Pool,
  ) {}

  async crear(
    userId:    string,
    productId: string,
    rating:    number,
    comment?:  string,
  ): Promise<Resena> {
    // Verificar que no exista ya una reseña de este usuario para este producto
    const { rows: existing } = await this.pool.query(
      'SELECT id FROM reviews WHERE product_id = $1 AND user_id = $2',
      [productId, userId],
    );
    if (existing.length > 0) {
      throw new ConflictException('Ya has dejado una reseña para este producto');
    }

    const { rows } = await this.pool.query<Resena>(
      `INSERT INTO reviews (product_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING id, product_id, user_id, rating, comment, created_at`,
      [productId, userId, rating, comment ?? null],
    );

    // Enriquecer con nombre del usuario
    const { rows: user } = await this.pool.query<{ name: string }>(
      'SELECT name FROM users WHERE id = $1',
      [userId],
    );

    return { ...rows[0], user_name: user[0]?.name ?? 'Usuario' };
  }

  async obtenerPorProducto(productId: string): Promise<Resena[]> {
    const { rows } = await this.pool.query<Resena>(
      `SELECT r.id, r.product_id, r.user_id, r.rating, r.comment,
              r.created_at, u.name AS user_name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC`,
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
      const rating = Number(row.rating);
      const count  = Number(row.count);
      porEstrella[rating] = count;
      suma  += rating * count;
      total += count;
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
      `SELECT r.id, r.product_id, r.user_id, r.rating, r.comment,
              r.created_at, u.name AS user_name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.product_id = $1 AND r.user_id = $2`,
      [productId, userId],
    );
    return rows[0] ?? null;
  }
}
