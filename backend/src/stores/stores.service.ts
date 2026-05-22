// src/stores/stores.service.ts
import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { POSTGRES_POOL } from '../database/postgres/postgres.provider';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Store } from './store.interface';

@Injectable()
export class StoresService {
  constructor(
    @Inject(POSTGRES_POOL) private readonly pool: Pool,
  ) {}

  async create(ownerId: string, dto: CreateStoreDto): Promise<Store> {
    const existing = await this.pool.query(
      'SELECT id FROM stores WHERE slug = $1',
      [dto.slug],
    );
    if (existing.rows.length > 0)
      throw new ConflictException('El slug ya está en uso');

    const { rows } = await this.pool.query(
      `INSERT INTO stores (owner_id, name, slug, description, logo_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [ownerId, dto.name, dto.slug, dto.description ?? null, dto.logo_url ?? null],
    );
    return rows[0];
  }

  async findAll(): Promise<Store[]> {
    const { rows } = await this.pool.query(
      'SELECT * FROM stores ORDER BY created_at DESC',
    );
    return rows;
  }

  async findById(id: string): Promise<Store> {
    const { rows } = await this.pool.query(
      'SELECT * FROM stores WHERE id = $1',
      [id],
    );
    if (!rows[0]) throw new NotFoundException('Tienda no encontrada');
    return rows[0];
  }

  async findBySlug(slug: string): Promise<Store> {
    const { rows } = await this.pool.query(
      'SELECT * FROM stores WHERE slug = $1 AND is_published = true',
      [slug],
    );
    if (!rows[0]) throw new NotFoundException('Tienda no encontrada');
    return rows[0];
  }

  async findByOwner(ownerId: string): Promise<Store[]> {
    const { rows } = await this.pool.query(
      'SELECT * FROM stores WHERE owner_id = $1 ORDER BY created_at DESC',
      [ownerId],
    );
    return rows;
  }

  async update(id: string, ownerId: string, role: string, dto: UpdateStoreDto): Promise<Store> {
    const store = await this.findById(id);

    // Solo el owner de la tienda o un admin puede editar
    const isAdmin = role === 'admin' || role === 'super_admin';
    if (store.owner_id !== ownerId && !isAdmin)
      throw new ForbiddenException('No tienes permiso para editar esta tienda');

    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;

    if (dto.name !== undefined)         { fields.push(`name = $${i++}`);         values.push(dto.name); }
    if (dto.slug !== undefined)         { fields.push(`slug = $${i++}`);         values.push(dto.slug); }
    if (dto.description !== undefined)  { fields.push(`description = $${i++}`);  values.push(dto.description); }
    if (dto.logo_url !== undefined)     { fields.push(`logo_url = $${i++}`);     values.push(dto.logo_url); }
    if (dto.is_published !== undefined) { fields.push(`is_published = $${i++}`); values.push(dto.is_published); }
    if (dto.theme !== undefined)        { fields.push(`theme = $${i++}`);        values.push(dto.theme); }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await this.pool.query(
      `UPDATE stores SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values,
    );
    return rows[0];
  }

  async delete(id: string, ownerId: string, role: string): Promise<void> {
    const store = await this.findById(id);
    const isAdmin = role === 'admin' || role === 'super_admin';
    if (store.owner_id !== ownerId && !isAdmin)
      throw new ForbiddenException('No tienes permiso para eliminar esta tienda');

    await this.pool.query('DELETE FROM stores WHERE id = $1', [id]);
  }
}