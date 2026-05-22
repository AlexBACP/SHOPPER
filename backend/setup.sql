-- ================================================================
--  SHOPPER — Setup completo de PostgreSQL
--  Ejecutar como: psql -U postgres -d shopperdb -f setup.sql
-- ================================================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── USERS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT        NOT NULL,
  email               TEXT        NOT NULL UNIQUE,
  password_hash       TEXT        NOT NULL,
  role                TEXT        NOT NULL DEFAULT 'buyer'
                      CHECK (role IN ('super_admin', 'admin', 'owner', 'buyer')),
  refresh_token_hash  TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ── STORES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stores (
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

CREATE INDEX IF NOT EXISTS idx_stores_owner_id   ON stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_stores_slug        ON stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_is_published ON stores(is_published);

-- ── ORDERS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status           TEXT        NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  total            NUMERIC(12, 2) NOT NULL,
  shipping_name    TEXT        NOT NULL,
  shipping_address TEXT        NOT NULL,
  shipping_city    TEXT        NOT NULL,
  shipping_notes   TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status   ON orders(status);

-- ── ORDER ITEMS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  store_id   UUID        NOT NULL,
  product_id TEXT        NOT NULL,
  title      TEXT        NOT NULL,
  sku        TEXT        NOT NULL,
  price      NUMERIC(12, 2) NOT NULL,
  quantity   INTEGER     NOT NULL CHECK (quantity > 0),
  image      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id  ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_store_id  ON order_items(store_id);

-- ── TRIGGER: actualizar updated_at automáticamente ───────
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_users') THEN
    CREATE TRIGGER set_updated_at_users
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_stores') THEN
    CREATE TRIGGER set_updated_at_stores
      BEFORE UPDATE ON stores
      FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_orders') THEN
    CREATE TRIGGER set_updated_at_orders
      BEFORE UPDATE ON orders
      FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END;
$$;

-- ── SUPER ADMIN INICIAL (opcional) ───────────────────────
-- Cambia el email y la contraseña antes de ejecutar.
-- La contraseña aquí es un hash bcrypt de "Admin123!"
-- Para generar tu propio hash: node -e "require('bcrypt').hash('TuPass',10).then(console.log)"
--
-- INSERT INTO users (name, email, password_hash, role)
-- VALUES (
--   'Super Admin',
--   'admin@shopper.com',
--   '$2b$10$K.0HwpsoPDzHMNiDNM2V8.9dYHOsv3VBGF4Y5O7ZWRExampleHash',
--   'super_admin'
-- )
-- ON CONFLICT (email) DO NOTHING;

-- ================================================================
--  Listo. Tablas creadas:
--    users, stores, orders, order_items
--  Con índices, constraints y trigger de updated_at.
-- ================================================================
