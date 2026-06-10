import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import { MongoClient, ObjectId } from 'mongodb';
import { POSTGRES_POOL } from '../database/postgres/postgres.provider';
import { MONGO_CLIENT } from '../database/mongodb/mongodb.provider';

export interface AdminStats {
  usuarios:   { total: number; buyers: number; owners: number; admins: number };
  tiendas:    { total: number; publicadas: number };
  productos:  number;
  pedidos:    { total: number; porEstado: Record<string, number> };
  ingresos:   number; // suma de pedidos confirmados/enviados/entregados
  topTiendas: { id: string; name: string; slug: string; pedidos: number; ventas: number }[];
  recientes:  { id: string; total: number; status: string; created_at: string; comprador: string }[];
}

@Injectable()
export class AdminService {
  constructor(
    @Inject(POSTGRES_POOL) private readonly pool:  Pool,
    @Inject(MONGO_CLIENT)  private readonly mongo: MongoClient,
  ) {}

  async stats(): Promise<AdminStats> {
    const [usuarios, tiendas, pedidosEstado, ingresos, top, recientes, productos] = await Promise.all([
      // Usuarios por rol
      this.pool.query<{ role: string; n: string }>(
        `SELECT role, COUNT(*) AS n FROM users GROUP BY role`,
      ),
      // Tiendas
      this.pool.query<{ total: string; publicadas: string }>(
        `SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE is_published) AS publicadas FROM stores`,
      ),
      // Pedidos por estado
      this.pool.query<{ status: string; n: string }>(
        `SELECT status, COUNT(*) AS n FROM orders GROUP BY status`,
      ),
      // Ingresos (pedidos pagados / en curso)
      this.pool.query<{ total: string }>(
        `SELECT COALESCE(SUM(total), 0) AS total FROM orders
          WHERE status IN ('confirmed','processing','shipped','delivered')`,
      ),
      // Top tiendas por nº de pedidos y ventas
      this.pool.query<{ id: string; name: string; slug: string; pedidos: string; ventas: string }>(
        `SELECT s.id, s.name, s.slug,
                COUNT(DISTINCT oi.order_id) AS pedidos,
                COALESCE(SUM(oi.price * oi.quantity), 0) AS ventas
           FROM stores s
           JOIN order_items oi ON oi.store_id = s.id
           JOIN orders o ON o.id = oi.order_id
          WHERE o.status IN ('confirmed','processing','shipped','delivered')
          GROUP BY s.id, s.name, s.slug
          ORDER BY ventas DESC
          LIMIT 5`,
      ),
      // Pedidos recientes
      this.pool.query<{ id: string; total: string; status: string; created_at: string; comprador: string }>(
        `SELECT o.id, o.total, o.status, o.created_at, COALESCE(u.name, 'Invitado') AS comprador
           FROM orders o
           LEFT JOIN users u ON u.id = o.buyer_id
          ORDER BY o.created_at DESC
          LIMIT 8`,
      ),
      // Productos activos (MongoDB)
      this.mongo.db().collection('products').countDocuments({ is_active: { $ne: false } }).catch(() => 0),
    ]);

    const rol = (r: string) => Number(usuarios.rows.find(x => x.role === r)?.n ?? 0);
    const porEstado: Record<string, number> = {};
    let totalPedidos = 0;
    for (const row of pedidosEstado.rows) {
      const n = Number(row.n);
      porEstado[row.status] = n;
      totalPedidos += n;
    }

    return {
      usuarios: {
        total:  usuarios.rows.reduce((s, r) => s + Number(r.n), 0),
        buyers: rol('buyer'),
        owners: rol('owner'),
        admins: rol('admin') + rol('super_admin'),
      },
      tiendas: {
        total:      Number(tiendas.rows[0]?.total ?? 0),
        publicadas: Number(tiendas.rows[0]?.publicadas ?? 0),
      },
      productos,
      pedidos: { total: totalPedidos, porEstado },
      ingresos: Number(ingresos.rows[0]?.total ?? 0),
      topTiendas: top.rows.map(r => ({
        id: r.id, name: r.name, slug: r.slug,
        pedidos: Number(r.pedidos), ventas: Number(r.ventas),
      })),
      recientes: recientes.rows.map(r => ({
        id: r.id, total: Number(r.total), status: r.status,
        created_at: r.created_at, comprador: r.comprador,
      })),
    };
  }

  // ── Moderación de productos (Mongo + nombre de tienda en PG) ──

  async listProducts(q?: string) {
    const filter: Record<string, unknown> = {};
    if (q && q.trim()) filter.title = { $regex: q.trim(), $options: 'i' };
    const productos = await this.mongo.db().collection('products')
      .find(filter).sort({ created_at: -1 }).limit(100).toArray();

    const storeIds = [...new Set(productos.map(p => p.store_id).filter(Boolean))];
    const storeMap = new Map<string, { name: string; slug: string }>();
    if (storeIds.length) {
      const { rows } = await this.pool.query<{ id: string; name: string; slug: string }>(
        'SELECT id, name, slug FROM stores WHERE id = ANY($1)', [storeIds],
      );
      rows.forEach(s => storeMap.set(s.id, { name: s.name, slug: s.slug }));
    }

    return productos.map(p => ({
      _id:       p._id.toString(),
      title:     p.title,
      price:     p.price,
      stock:     p.stock,
      category:  p.category ?? null,
      is_active: p.is_active !== false,
      image:     p.images?.[0] ?? null,
      storeName: storeMap.get(p.store_id)?.name ?? '—',
      storeSlug: storeMap.get(p.store_id)?.slug ?? '',
    }));
  }

  async setProductActive(id: string, isActive: boolean): Promise<void> {
    let oid: ObjectId;
    try { oid = new ObjectId(id); } catch { throw new BadRequestException('ID inválido'); }
    await this.mongo.db().collection('products').updateOne(
      { _id: oid }, { $set: { is_active: isActive, updated_at: new Date() } },
    );
  }

  async deleteProduct(id: string): Promise<void> {
    let oid: ObjectId;
    try { oid = new ObjectId(id); } catch { throw new BadRequestException('ID inválido'); }
    await this.mongo.db().collection('products').deleteOne({ _id: oid });
  }

  // ── Configuración de plataforma (solo super_admin) ───────────

  private readonly SETTING_KEYS = ['free_shipping_threshold', 'default_commission_pct', 'featured_coupon'];

  async getSettings(): Promise<Record<string, string>> {
    const { rows } = await this.pool.query<{ key: string; value: string }>(
      'SELECT key, value FROM platform_settings',
    );
    const out: Record<string, string> = {};
    rows.forEach(r => { out[r.key] = r.value; });
    return out;
  }

  async updateSettings(patch: Record<string, string>): Promise<Record<string, string>> {
    for (const [k, v] of Object.entries(patch ?? {})) {
      if (!this.SETTING_KEYS.includes(k)) continue;
      await this.pool.query(
        `INSERT INTO platform_settings (key, value, updated_at) VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [k, String(v)],
      );
    }
    return this.getSettings();
  }
}
