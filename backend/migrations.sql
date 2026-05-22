-- ================================================================
--  SHOPPER — Migración OAuth
--  Ejecutar como: psql -U postgres -d shopperdb -f migrations.sql
--
--  Agrega soporte para login con Google, Facebook y Apple.
--  Columnas opcionales: oauth_provider, oauth_id.
--  password_hash se vuelve nullable para cuentas OAuth puras.
-- ================================================================

-- 1. Permitir password_hash nulo (cuentas OAuth no tienen contraseña)
ALTER TABLE users
  ALTER COLUMN password_hash DROP NOT NULL;

-- 2. Proveedor OAuth: 'google' | 'facebook' | 'apple'
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS oauth_provider TEXT;

-- 3. ID del proveedor (sub de Google, id de Facebook, etc.)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS oauth_id TEXT;

-- 4. Índice único por proveedor + id (evita duplicados)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_oauth
  ON users (oauth_provider, oauth_id)
  WHERE oauth_provider IS NOT NULL AND oauth_id IS NOT NULL;

-- ================================================================
--  Listo (OAuth).
--  Nuevos campos en users:
--    oauth_provider  TEXT nullable
--    oauth_id        TEXT nullable
--    password_hash   TEXT nullable (antes NOT NULL)
-- ================================================================


-- ================================================================
--  SHOPPER — Migración Reseñas y Calificaciones
--  Ejecutar junto con el bloque anterior o por separado.
-- ================================================================

-- Tabla de reseñas de productos
CREATE TABLE IF NOT EXISTS reviews (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id  TEXT        NOT NULL,   -- MongoDB ObjectId del producto
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating      SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Una sola reseña por (usuario, producto)
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique
  ON reviews (product_id, user_id);

-- Índice para consultas por producto (las más frecuentes)
CREATE INDEX IF NOT EXISTS idx_reviews_product
  ON reviews (product_id);

-- ================================================================
--  Listo (Reseñas).
--  Nueva tabla: reviews(id, product_id, user_id, rating, comment, created_at)
-- ================================================================
