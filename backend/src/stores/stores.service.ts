// src/stores/stores.service.ts
import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { randomBytes } from 'crypto';
import { POSTGRES_POOL } from '../database/postgres/postgres.provider';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Store } from './store.interface';

@Injectable()
export class StoresService {
  constructor(
    @Inject(POSTGRES_POOL) private readonly pool: Pool,
  ) {}

  // ── Helpers ────────────────────────────────────────────────────────────

  /** Convierte un nombre en un slug URL-safe (sin acentos ni símbolos). */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '') // quita acentos
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'tienda';
  }

  /** Devuelve un slug único, añadiendo un sufijo numérico si ya existe. */
  private async uniqueSlug(base: string): Promise<string> {
    let slug = base;
    let n = 1;
    // Reintenta hasta encontrar uno libre
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { rows } = await this.pool.query('SELECT 1 FROM stores WHERE slug = $1', [slug]);
      if (rows.length === 0) return slug;
      n += 1;
      slug = `${base}-${n}`;
    }
  }

  /** El campo `theme` se guarda como TEXT (JSON string). Lo parseamos al leer. */
  private hydrate(row: any): Store {
    if (row && typeof row.theme === 'string') {
      try {
        const parsed = JSON.parse(row.theme);
        row.theme = parsed && typeof parsed === 'object' ? parsed : null;
      } catch {
        row.theme = null; // valores antiguos como 'default' → sin tema
      }
    }
    return row;
  }

  private serializeTheme(theme: unknown): string | null {
    if (theme === null || theme === undefined) return null;
    return typeof theme === 'string' ? theme : JSON.stringify(theme);
  }

  // ── CRUD ───────────────────────────────────────────────────────────────

  async create(ownerId: string, dto: CreateStoreDto): Promise<Store> {
    // Anti-abuso: solo cuentas con correo verificado pueden abrir tienda.
    const { rows: u } = await this.pool.query<{ email_verified: boolean }>(
      'SELECT email_verified FROM users WHERE id = $1',
      [ownerId],
    );
    if (u[0] && u[0].email_verified === false) {
      throw new ForbiddenException('Verifica tu correo antes de abrir una tienda. Te enviamos un enlace al registrarte.');
    }

    // Slug: el enviado (si viene) o generado a partir del nombre, garantizando unicidad.
    const base = this.slugify(dto.slug?.trim() || dto.name);
    const slug = await this.uniqueSlug(base);

    if (dto.slug) {
      const taken = await this.pool.query('SELECT id FROM stores WHERE slug = $1', [dto.slug]);
      if (taken.rows.length > 0) throw new ConflictException('El slug ya está en uso');
    }

    const { rows } = await this.pool.query(
      `INSERT INTO stores (owner_id, name, slug, description, logo_url, theme)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        ownerId,
        dto.name,
        slug,
        dto.description ?? null,
        dto.logo_url ?? null,
        this.serializeTheme(dto.theme),
      ],
    );
    return this.hydrate(rows[0]);
  }

  async findAll(): Promise<Store[]> {
    const { rows } = await this.pool.query(
      'SELECT * FROM stores WHERE is_published = true ORDER BY created_at DESC',
    );
    return rows.map((r) => this.hydrate(r));
  }

  async findAllAdmin(): Promise<Store[]> {
    const { rows } = await this.pool.query(
      'SELECT * FROM stores ORDER BY created_at DESC',
    );
    return rows.map((r) => this.hydrate(r));
  }

  async findById(id: string): Promise<Store> {
    const { rows } = await this.pool.query(
      'SELECT * FROM stores WHERE id = $1',
      [id],
    );
    if (!rows[0]) throw new NotFoundException('Tienda no encontrada');
    return this.hydrate(rows[0]);
  }

  async findBySlug(slug: string): Promise<Store> {
    const { rows } = await this.pool.query(
      'SELECT * FROM stores WHERE slug = $1 AND is_published = true',
      [slug],
    );
    if (!rows[0]) throw new NotFoundException('Tienda no encontrada');
    return this.hydrate(rows[0]);
  }

  async findByOwner(ownerId: string): Promise<Store[]> {
    const { rows } = await this.pool.query(
      'SELECT * FROM stores WHERE owner_id = $1 ORDER BY created_at DESC',
      [ownerId],
    );
    return rows.map((r) => this.hydrate(r));
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
    if (dto.theme !== undefined)        { fields.push(`theme = $${i++}`);        values.push(this.serializeTheme(dto.theme)); }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await this.pool.query(
      `UPDATE stores SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values,
    );
    return this.hydrate(rows[0]);
  }

  async delete(id: string, ownerId: string, role: string): Promise<void> {
    const store = await this.findById(id);
    const isAdmin = role === 'admin' || role === 'super_admin';
    if (store.owner_id !== ownerId && !isAdmin)
      throw new ForbiddenException('No tienes permiso para eliminar esta tienda');

    await this.pool.query('DELETE FROM stores WHERE id = $1', [id]);
  }

  // ── Versiones (snapshots) del diseño ─────────────────────────────────────

  private async assertOwnerOrAdmin(storeId: string, ownerId: string, role: string): Promise<Store> {
    const store = await this.findById(storeId);
    const isAdmin = role === 'admin' || role === 'super_admin';
    if (store.owner_id !== ownerId && !isAdmin)
      throw new ForbiddenException('No tienes permiso sobre esta tienda');
    return store;
  }

  /** Guarda una versión del theme. Conserva solo las últimas 20 por tienda. */
  async createSnapshot(storeId: string, ownerId: string, role: string, theme: unknown, label?: string) {
    await this.assertOwnerOrAdmin(storeId, ownerId, role);
    const { rows } = await this.pool.query(
      `INSERT INTO store_theme_snapshots (store_id, label, theme)
       VALUES ($1, $2, $3) RETURNING id, label, created_at`,
      [storeId, label ?? null, this.serializeTheme(theme)],
    );
    await this.pool.query(
      `DELETE FROM store_theme_snapshots
       WHERE store_id = $1 AND id NOT IN (
         SELECT id FROM store_theme_snapshots WHERE store_id = $1 ORDER BY created_at DESC LIMIT 20)`,
      [storeId],
    ).catch(() => null);
    return rows[0];
  }

  async listSnapshots(storeId: string, ownerId: string, role: string) {
    await this.assertOwnerOrAdmin(storeId, ownerId, role);
    const { rows } = await this.pool.query(
      `SELECT id, label, created_at FROM store_theme_snapshots
       WHERE store_id = $1 ORDER BY created_at DESC`,
      [storeId],
    );
    return rows;
  }

  /** Restaura una versión: copia su theme al theme actual de la tienda. */
  async restoreSnapshot(storeId: string, snapId: string, ownerId: string, role: string): Promise<Store> {
    await this.assertOwnerOrAdmin(storeId, ownerId, role);
    const { rows } = await this.pool.query(
      'SELECT theme FROM store_theme_snapshots WHERE id = $1 AND store_id = $2',
      [snapId, storeId],
    );
    if (!rows[0]) throw new NotFoundException('Versión no encontrada');
    const { rows: upd } = await this.pool.query(
      'UPDATE stores SET theme = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [rows[0].theme, storeId],
    );
    return this.hydrate(upd[0]);
  }

  // ── Vista previa compartible (token de solo lectura) ─────────────────────

  /** Crea un enlace de vista previa del theme dado, válido 7 días. */
  async createPreview(storeId: string, ownerId: string, role: string, theme: unknown): Promise<{ token: string }> {
    await this.assertOwnerOrAdmin(storeId, ownerId, role);
    const token = randomBytes(18).toString('base64url'); // ~24 chars URL-safe
    await this.pool.query(
      `INSERT INTO store_theme_previews (token, store_id, theme, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')`,
      [token, storeId, this.serializeTheme(theme)],
    );
    return { token };
  }

  /** Resuelve un token de vista previa → tienda + theme (público, sin auth). */
  async getPreviewByToken(token: string): Promise<{ store_id: string; theme: unknown }> {
    const { rows } = await this.pool.query(
      'SELECT store_id, theme FROM store_theme_previews WHERE token = $1 AND expires_at > NOW()',
      [token],
    );
    if (!rows[0]) throw new NotFoundException('Vista previa no encontrada o expirada');
    return { store_id: rows[0].store_id, theme: this.hydrate({ theme: rows[0].theme }).theme };
  }
}
