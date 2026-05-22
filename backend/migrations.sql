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

-- ================================================================
--  Migraciones aplicadas:
--    1 — OAuth (oauth_provider, oauth_id, password_hash nullable)
--    2 — reviews (calificaciones de productos)
--    3 — password_resets (recuperación de contraseña)
--    4 — orders.status incluye 'refunded'
--    5 — orders.user_id renombrado a buyer_id (si aplica)
-- ================================================================
