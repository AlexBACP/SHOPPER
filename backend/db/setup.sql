-- ================================================================
--  SHOPPER — Setup completo de PostgreSQL
--  Ejecutar como: psql -U postgres -d shopperdb -f setup.sql
--  Incluye: users, stores, orders, order_items, reviews, password_resets
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── USERS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT        NOT NULL,
  email              TEXT        NOT NULL UNIQUE,
  password_hash      TEXT,                    -- NULL para cuentas OAuth puras
  role               TEXT        NOT NULL DEFAULT 'buyer'
                     CHECK (role IN ('super_admin', 'admin', 'owner', 'buyer')),
  refresh_token_hash TEXT,
  oauth_provider     TEXT,
  oauth_id           TEXT,
  email_verified          BOOLEAN NOT NULL DEFAULT true,  -- el registro por email pone false en código
  email_verify_token_hash TEXT,
  email_verify_expires    TIMESTAMPTZ,
  totp_secret             TEXT,                           -- secreto 2FA (TOTP), null si no configurado
  totp_enabled            BOOLEAN NOT NULL DEFAULT false,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_oauth
  ON users (oauth_provider, oauth_id)
  WHERE oauth_provider IS NOT NULL AND oauth_id IS NOT NULL;

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

CREATE INDEX IF NOT EXISTS idx_stores_owner_id    ON stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_stores_slug         ON stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_is_published ON stores(is_published);

-- ── ORDERS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id         UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status           TEXT           NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  total            NUMERIC(12, 2) NOT NULL,
  shipping_cost    NUMERIC(12, 2) NOT NULL DEFAULT 0,
  shipping_name    TEXT           NOT NULL,
  shipping_address TEXT           NOT NULL,
  shipping_city    TEXT           NOT NULL,
  shipping_notes   TEXT,
  carrier          TEXT,
  tracking_number  TEXT,
  proof_image      TEXT,
  shipped_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status   ON orders(status);

-- ── ORDER ITEMS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id         UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID           NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  store_id   UUID           NOT NULL,
  product_id TEXT           NOT NULL,
  title      TEXT           NOT NULL,
  sku        TEXT           NOT NULL,
  price      NUMERIC(12, 2) NOT NULL,
  quantity   INTEGER        NOT NULL CHECK (quantity > 0),
  image      TEXT,
  created_at TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_store_id ON order_items(store_id);

-- ── EDITOR VISUAL: snapshots + vista previa compartible ──
CREATE TABLE IF NOT EXISTS store_theme_snapshots (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id   UUID        NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  label      TEXT,
  theme      TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_theme_snapshots_store
  ON store_theme_snapshots(store_id, created_at DESC);

CREATE TABLE IF NOT EXISTS store_theme_previews (
  token      TEXT        PRIMARY KEY,
  store_id   UUID        NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  theme      TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_theme_previews_store ON store_theme_previews(store_id);

-- ── REVIEWS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT      NOT NULL,
  user_id    UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating     SMALLINT  NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique
  ON reviews (product_id, user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product
  ON reviews (product_id);

-- ── PASSWORD RESETS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_resets (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT        NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires  ON password_resets(expires_at);

-- ── TRIGGERS: updated_at automático ─────────────────────
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

-- ================================================================
--  Tablas creadas:
--    users         — con OAuth y updated_at
--    stores        — con is_published
--    orders        — buyer_id, status incluye 'refunded'
--    order_items   — con store_id y product_id (MongoDB ObjectId)
--    reviews       — calificaciones de productos (1-5 estrellas)
--    password_resets — tokens para recuperación de contraseña
-- ================================================================
