#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  SHOPPER · Inicialización de la base de datos en PRODUCCIÓN
#  Ejecuta, en orden:
#    1) Esquema base (backend/db/setup.sql)
#    2) Migraciones incrementales (scripts/migrate.js)
#    3) Cuentas admin (scripts/create-admins.js)  ← pide contraseñas
#    4) Datos demo opcionales (scripts/seed.js)
#
#  Uso (desde la raíz del proyecto en el servidor):
#    bash deploy/init-db.sh
#
#  Es idempotente: se puede correr varias veces sin romper datos.
# ─────────────────────────────────────────────────────────────
set -euo pipefail

# Ir a la raíz del proyecto (carpeta padre de deploy/)
cd "$(dirname "$0")/.."

# Cargar variables del .env (DB_USER, DB_NAME…)
set -a; [ -f .env ] && . ./.env; set +a
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-shopperdb}"

COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml"

echo "==> 1/4 · Aplicando esquema base (setup.sql)..."
$COMPOSE exec -T postgres psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" < backend/db/setup.sql
echo "    ✅ Esquema aplicado"

echo "==> 2/4 · Migraciones incrementales..."
$COMPOSE exec -T backend node scripts/migrate.js
echo "    ✅ Migraciones aplicadas"

echo "==> 3/4 · Cuentas de administración"
read -rsp "    Contraseña para superadmin@shopper.co: " SUPERADMIN_PASSWORD; echo
read -rsp "    Contraseña para admin@shopper.co:      " ADMIN_PASSWORD; echo
export SUPERADMIN_PASSWORD ADMIN_PASSWORD
$COMPOSE exec -T -e SUPERADMIN_PASSWORD -e ADMIN_PASSWORD backend node scripts/create-admins.js
echo "    ✅ Admins listos"

echo "==> 4/4 · Datos de demostración (10 tiendas + productos)"
read -rp "    ¿Insertar datos demo? [s/N]: " RESP
if [[ "${RESP:-N}" =~ ^[sS]$ ]]; then
  $COMPOSE exec -T backend node scripts/seed.js
  echo "    ✅ Demo insertada"
else
  echo "    ⏭  Demo omitida"
fi

echo ""
echo "🎉 Base de datos inicializada."
