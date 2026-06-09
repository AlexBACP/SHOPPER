-- ================================================================
--  SHOPPER — Migraciones incrementales
--  Aplicar sobre una BD ya creada con setup.sql (versión original).
--  Cada bloque es idempotente (IF NOT EXISTS / DO NOTHING).
-- ================================================================

-- ── MIGRACIÓN 1: OAuth en users ──────────────────────────
-- Permite login con Google, Facebook y Apple.
ALTER TABLE users
  ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS oauth_provider TEXT;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS oauth_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_oauth
  ON users (oauth_provider, oauth_id)
  WHERE oauth_provider IS NOT NULL AND oauth_id IS NOT NULL;

-- ── MIGRACIÓN 2: Reseñas de productos ────────────────────
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

-- ── MIGRACIÓN 3: Recuperación de contraseña ─────────────
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

-- ── MIGRACIÓN 4: Agregar 'refunded' al CHECK de orders ───
-- PostgreSQL no permite ALTER CHECK directamente; hay que
-- eliminar el constraint anterior y crear uno nuevo.
DO $$
BEGIN
  -- Eliminar el CHECK antiguo si existe (nombre por defecto de PG)
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_status_check' AND conrelid = 'orders'::regclass
  ) THEN
    ALTER TABLE orders DROP CONSTRAINT orders_status_check;
  END IF;

  -- Agregar el nuevo CHECK que incluye 'refunded'
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_status_check_v2' AND conrelid = 'orders'::regclass
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_status_check_v2
      CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded'));
  END IF;
END;
$$;

-- ── MIGRACIÓN 5: Renombrar buyer_id si aún se llama user_id ─
-- Solo ejecutar si la columna todavía se llama user_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE orders RENAME COLUMN user_id TO buyer_id;
  END IF;
END;
$$;

-- ── MIGRACIÓN 6: Campos de envío adicionales en orders ──────
-- Teléfono de contacto y departamento (Colombia).
-- Nullable para no romper órdenes existentes.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_phone TEXT;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_dept TEXT;

-- ── MIGRACIÓN 7: Tabla de cupones de descuento ──────────────
CREATE TABLE IF NOT EXISTS coupons (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code         TEXT        NOT NULL UNIQUE,
  discount_pct INTEGER     NOT NULL CHECK (discount_pct > 0 AND discount_pct <= 100),
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  max_uses     INTEGER,                        -- NULL = usos ilimitados
  times_used   INTEGER     NOT NULL DEFAULT 0,
  expires_at   TIMESTAMPTZ,                    -- NULL = sin vencimiento
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

-- Cupones iniciales de prueba
INSERT INTO coupons (code, discount_pct, is_active) VALUES
  ('SHOPPER10',  10, true),
  ('BIENVENIDO', 15, true),
  ('COLOMBIA20', 20, true)
ON CONFLICT (code) DO NOTHING;

-- ── MIGRACIÓN 8: Campos de descuento en orders ──────────────
-- Guardar el cupón y porcentaje aplicado en cada orden.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS coupon_code   TEXT;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS discount_pct  INTEGER NOT NULL DEFAULT 0;

-- ── MIGRACIÓN 9: Envíos (transportadora, guía, costo, prueba) ───────────────
-- Soporta integración manual con Servientrega / Interrapidísimo:
--   carrier        — transportadora elegida por el vendedor
--   tracking_number— N° de guía para el link de rastreo público
--   shipping_cost  — costo de envío calculado por zona (incluido en total)
--   proof_image    — foto opcional del paquete recogido
--   shipped_at     — fecha en que se marcó como enviado
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_cost   NUMERIC(12,2) NOT NULL DEFAULT 0;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS carrier         TEXT;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS tracking_number TEXT;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS proof_image     TEXT;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipped_at      TIMESTAMPTZ;

-- ── MIGRACIÓN 10: Editor visual — versiones y vista previa ──────────────────
-- Snapshots del theme (historial restaurable) y enlaces de vista previa
-- compartibles de solo lectura (token con expiración).
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

-- ================================================================
--  Migraciones aplicadas:
--    1 — OAuth (oauth_provider, oauth_id, password_hash nullable)
--    2 — reviews (calificaciones de productos)
--    3 — password_resets (recuperación de contraseña)
--    4 — orders.status incluye 'refunded'
--    5 — orders.user_id renombrado a buyer_id (si aplica)
--    6 — orders: shipping_phone, shipping_dept (nullable)
--    7 — coupons (tabla + 3 cupones iniciales)
--    8 — orders: coupon_code, discount_pct
--    9 — orders: shipping_cost, carrier, tracking_number, proof_image, shipped_at
--   10 — editor visual: store_theme_snapshots + store_theme_previews
-- ================================================================
