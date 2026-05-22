// src/users/users.service.ts
import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';
import { POSTGRES_POOL } from '../database/postgres/postgres.provider';
import { User } from './user.interface';

@Injectable()
export class UsersService {
  constructor(
    @Inject(POSTGRES_POOL) private readonly pool: Pool,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    const { rows } = await this.pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email],
    );
    return rows[0] ?? null;
  }

  async findById(id: string): Promise<User | null> {
    const { rows } = await this.pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id],
    );
    return rows[0] ?? null;
  }

  async create(name: string, email: string, passwordHash: string, role = 'buyer'): Promise<User> {
    const { rows } = await this.pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, email, passwordHash, role],
    );
    return rows[0];
  }

  async updateRefreshToken(id: string, tokenHash: string | null): Promise<void> {
    await this.pool.query(
      'UPDATE users SET refresh_token_hash = $1 WHERE id = $2',
      [tokenHash, id],
    );
  }

  // ── Para el panel de admin ───────────────────────────

  async findAll(): Promise<Omit<User, 'password_hash' | 'refresh_token_hash'>[]> {
    const { rows } = await this.pool.query(
      `SELECT id, name, email, role, created_at
       FROM users
       ORDER BY created_at DESC`,
    );
    return rows;
  }

  async updateRole(targetId: string, newRole: string, requesterId: string): Promise<User> {
    if (targetId === requesterId) {
      throw new ForbiddenException('No puedes cambiar tu propio rol');
    }
    const target = await this.findById(targetId);
    if (!target) throw new NotFoundException('Usuario no encontrado');
    if (target.role === 'super_admin') {
      throw new ForbiddenException('No puedes modificar un super administrador');
    }
    const { rows } = await this.pool.query(
      `UPDATE users SET role = $1 WHERE id = $2
       RETURNING id, name, email, role, created_at`,
      [newRole, targetId],
    );
    return rows[0];
  }

  async deactivate(targetId: string, requesterId: string): Promise<void> {
    if (targetId === requesterId) {
      throw new ForbiddenException('No puedes desactivar tu propia cuenta');
    }
    const target = await this.findById(targetId);
    if (!target) throw new NotFoundException('Usuario no encontrado');
    if (target.role === 'super_admin') {
      throw new ForbiddenException('No puedes desactivar un super administrador');
    }
    await this.updateRefreshToken(targetId, null);
  }

  // ── NUEVO: para la página de perfil ─────────────────

  async updatePassword(id: string, newHash: string): Promise<void> {
    await this.pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newHash, id],
    );
  }

  async updateMe(id: string, name: string): Promise<Omit<User, 'password_hash' | 'refresh_token_hash'>> {
    const { rows } = await this.pool.query(
      `UPDATE users SET name = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, email, role, created_at`,
      [name, id],
    );
    if (!rows[0]) throw new NotFoundException('Usuario no encontrado');
    return rows[0];
  }

  // ── OAuth: buscar o crear usuario por proveedor ──────────

  async findByOAuth(provider: string, oauthId: string): Promise<User | null> {
    const { rows } = await this.pool.query(
      'SELECT * FROM users WHERE oauth_provider = $1 AND oauth_id = $2',
      [provider, oauthId],
    );
    return rows[0] ?? null;
  }

  async createOAuthUser(
    name: string,
    email: string,
    provider: string,
    oauthId: string,
    role = 'buyer',
  ): Promise<User> {
    const { rows } = await this.pool.query(
      `INSERT INTO users (name, email, password_hash, role, oauth_provider, oauth_id)
       VALUES ($1, $2, NULL, $3, $4, $5)
       RETURNING *`,
      [name, email, role, provider, oauthId],
    );
    return rows[0];
  }

  async linkOAuth(userId: string, provider: string, oauthId: string): Promise<void> {
    await this.pool.query(
      'UPDATE users SET oauth_provider = $1, oauth_id = $2 WHERE id = $3',
      [provider, oauthId, userId],
    );
  }
}
