/**
 * SHOPPER — Reset completo de la base de datos PostgreSQL
 *
 * ⚠️  BORRA TODOS LOS DATOS — solo usar en desarrollo
 *
 * Ejecutar desde C:\SHOPPER\backend:
 *   node reset-db.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || '127.0.0.1',
  port:     parseInt(process.env.DB_PORT || '5432'),
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME     || 'shopperdb',
});

const SCHEMA = `
/* ── Extensión ───────────────────────────────────────────────────────── */
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

/* ── Eliminar tablas en orden inverso de dependencia ─────────────────── */
DROP TABLE IF EXISTS password_resets CASCADE;
DROP TABLE IF EXISTS reviews        CASCADE;
DROP TABLE IF EXISTS order_items    CASCADE;
DROP TABLE IF EXISTS orders         CASCADE;
DROP TABLE IF EXISTS coupons        CASCADE;
DROP TABLE IF EXISTS stores         CASCADE;
DROP TABLE IF EXISTS users          CASCADE;

/* ── USERS ───────────────────────────────────────────────────────────── */
CREATE TABLE users (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT        NOT NULL,
  email              TEXT        NOT NULL UNIQUE,
  password_hash      TEXT,
  role               TEXT        NOT NULL DEFAULT 'buyer'
                     CHECK (role IN ('super_admin','admin','owner','buyer')),
  refresh_token_hash TEXT,
  oauth_provider     TEXT,
  oauth_id           TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_users_oauth
  ON users (oauth_provider, oauth_id)
  WHERE oauth_provider IS NOT NULL AND oauth_id IS NOT NULL;

/* ── STORES ──────────────────────────────────────────────────────────── */
CREATE TABLE stores (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  slug         TEXT        NOT NULL UNIQUE,
  description  TEXT,
  logo_url     TEXT,
  theme        TEXT        DEFAULT 'default',
  is_published BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_stores_owner_id    ON stores(owner_id);
CREATE INDEX idx_stores_slug        ON stores(slug);
CREATE INDEX idx_stores_published   ON stores(is_published);

/* ── COUPONS ─────────────────────────────────────────────────────────── */
CREATE TABLE coupons (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code         TEXT        NOT NULL UNIQUE,
  discount_pct INTEGER     NOT NULL CHECK (discount_pct > 0 AND discount_pct <= 100),
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  max_uses     INTEGER,
  times_used   INTEGER     NOT NULL DEFAULT 0,
  expires_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_coupons_code ON coupons(code);

/* ── ORDERS ──────────────────────────────────────────────────────────── */
CREATE TABLE orders (
  id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id         UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status           TEXT           NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  total            NUMERIC(12,2)  NOT NULL,
  shipping_name    TEXT           NOT NULL,
  shipping_phone   TEXT,
  shipping_address TEXT           NOT NULL,
  shipping_city    TEXT           NOT NULL,
  shipping_dept    TEXT,
  shipping_notes   TEXT,
  coupon_code      TEXT,
  discount_pct     INTEGER        NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_status   ON orders(status);

/* ── ORDER_ITEMS ─────────────────────────────────────────────────────── */
CREATE TABLE order_items (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  store_id   UUID          NOT NULL,
  product_id TEXT          NOT NULL,
  title      TEXT          NOT NULL,
  sku        TEXT          NOT NULL,
  price      NUMERIC(12,2) NOT NULL,
  quantity   INTEGER       NOT NULL CHECK (quantity > 0),
  image      TEXT,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_store_id ON order_items(store_id);

/* ── REVIEWS ─────────────────────────────────────────────────────────── */
CREATE TABLE reviews (
  id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT      NOT NULL,
  user_id    UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating     SMALLINT  NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_reviews_unique ON reviews(product_id, user_id);
CREATE INDEX        idx_reviews_product ON reviews(product_id);

/* ── PASSWORD_RESETS ─────────────────────────────────────────────────── */
CREATE TABLE password_resets (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT        NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pw_resets_user    ON password_resets(user_id);
CREATE INDEX idx_pw_resets_expires ON password_resets(expires_at);

/* ── TRIGGER updated_at automático ───────────────────────────────────── */
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON users  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_stores
  BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_orders
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

/* ── Cupones iniciales ───────────────────────────────────────────────── */
INSERT INTO coupons (code, discount_pct, is_active) VALUES
  ('SHOPPER10',  10, true),
  ('BIENVENIDO', 15, true),
  ('COLOMBIA20', 20, true);
`;

async function reset() {
  console.log('⚠️  Reseteando base de datos PostgreSQL...\n');
  const client = await pool.connect();
  try {
    await client.query(SCHEMA);
    console.log('✅ Tablas recreadas:');
    console.log('   users · stores · coupons · orders · order_items · reviews · password_resets');
    console.log('\n✅ Cupones insertados: SHOPPER10 · BIENVENIDO · COLOMBIA20');
    console.log('\n🌱 Ahora corre: node seed.js');
  } catch (err) {
    console.error('❌ Error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

reset().catch(() => process.exit(1));
