import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { POSTGRES_POOL } from '../database/postgres/postgres.provider';

@Injectable()
export class CouponsService {
  constructor(@Inject(POSTGRES_POOL) private readonly pool: Pool) {}

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
