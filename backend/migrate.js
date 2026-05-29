/**
 * SHOPPER — Ejecutor de migraciones
 * Aplica migrations.sql contra la BD configurada en .env
 *
 * Ejecutar desde C:\SHOPPER\backend:
 *   node migrate.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs       = require('fs');
const path     = require('path');

const pool = new Pool({
  host:     process.env.DB_HOST     || '127.0.0.1',
  port:     parseInt(process.env.DB_PORT || '5432'),
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME     || 'shopperdb',
});

const PASOS = [
  // ── Columnas base de orders que pueden faltar ───────────────────────────
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_name    TEXT`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_city    TEXT`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_notes   TEXT`,
  // ── Migraciones incrementales de orders ────────────────────────────────
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_phone TEXT`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_dept  TEXT`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code    TEXT`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_pct   INTEGER NOT NULL DEFAULT 0`,
  // ── Columnas de order_items que pueden faltar ───────────────────────────
  `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS store_id   UUID`,
  `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_id TEXT`,
  `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS title      TEXT`,
  `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS sku        TEXT`,
  `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS price      NUMERIC(12,2)`,
  `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS quantity   INTEGER`,
  `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS image      TEXT`,
  // ── Tabla coupons ───────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS coupons (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    code         TEXT        NOT NULL UNIQUE,
    discount_pct INTEGER     NOT NULL CHECK (discount_pct > 0 AND discount_pct <= 100),
    is_active    BOOLEAN     NOT NULL DEFAULT true,
    max_uses     INTEGER,
    times_used   INTEGER     NOT NULL DEFAULT 0,
    expires_at   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code)`,
  `INSERT INTO coupons (code, discount_pct, is_active) VALUES
     ('SHOPPER10',  10, true),
     ('BIENVENIDO', 15, true),
     ('COLOMBIA20', 20, true)
   ON CONFLICT (code) DO NOTHING`,
  // ── Ajuste de status check en orders ───────────────────────────────────
  `DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'orders_status_check_v2' AND conrelid = 'orders'::regclass
    ) THEN
      ALTER TABLE orders
        ADD CONSTRAINT orders_status_check_v2
        CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded'));
    END IF;
  END; $$`,
];

async function migrate() {
  console.log('🔄 Aplicando migraciones...\n');
  const client = await pool.connect();
  try {
    for (const sql of PASOS) {
      const preview = sql.trim().replace(/\s+/g, ' ').slice(0, 70);
      try {
        await client.query(sql);
        console.log(`  ✅ ${preview}`);
      } catch (e) {
        // Si ya existe o hay conflicto no crítico, solo avisar
        console.log(`  ⚠️  ${preview}`);
        console.log(`      → ${e.message.split('\n')[0]}`);
      }
    }
    console.log('\n✅ Migraciones completadas — ya puedes hacer checkout');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => {
  console.error('❌ Error en migración:', err.message);
  process.exit(1);
});
