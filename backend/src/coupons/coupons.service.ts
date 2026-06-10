import { Injectable, Inject, ConflictException, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { POSTGRES_POOL } from '../database/postgres/postgres.provider';

@Injectable()
export class CouponsService {
  constructor(@Inject(POSTGRES_POOL) private readonly pool: Pool) {}

  // ── Admin: CRUD de cupones ────────────────────────────

  async listAll() {
    const { rows } = await this.pool.query(
      `SELECT id, code, discount_pct, is_active, max_uses, times_used, expires_at, created_at
         FROM coupons ORDER BY created_at DESC`,
    );
    return rows;
  }

  async create(dto: { code: string; discount_pct: number; max_uses?: number | null; expires_at?: string | null }) {
    const code = dto.code.toUpperCase().trim();
    const { rows: dup } = await this.pool.query('SELECT id FROM coupons WHERE code = $1', [code]);
    if (dup[0]) throw new ConflictException('Ya existe un cupón con ese código');
    const { rows } = await this.pool.query(
      `INSERT INTO coupons (code, discount_pct, max_uses, expires_at)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [code, dto.discount_pct, dto.max_uses ?? null, dto.expires_at ?? null],
    );
    return rows[0];
  }

  async toggleActive(id: string, isActive: boolean) {
    const { rows } = await this.pool.query(
      `UPDATE coupons SET is_active = $1 WHERE id = $2 RETURNING *`,
      [isActive, id],
    );
    if (!rows[0]) throw new NotFoundException('Cupón no encontrado');
    return rows[0];
  }

  async remove(id: string): Promise<void> {
    await this.pool.query('DELETE FROM coupons WHERE id = $1', [id]);
  }

  async validate(code: string): Promise<{ valid: boolean; code?: string; discount?: number; message?: string }> {
    const normalized = code.toUpperCase().trim();
    const { rows } = await this.pool.query(
      `SELECT code, discount_pct FROM coupons
       WHERE code = $1
         AND is_active = true
         AND (max_uses IS NULL OR times_used < max_uses)
         AND (expires_at IS NULL OR expires_at > NOW())`,
      [normalized],
    );
    if (!rows[0]) {
      return { valid: false, message: 'Cupón inválido o expirado' };
    }
    return { valid: true, code: rows[0].code as string, discount: rows[0].discount_pct as number };
  }
}
