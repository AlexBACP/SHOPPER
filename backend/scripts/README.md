# Scripts de utilidad (backend)

Scripts standalone de Node que operan contra la BD configurada en `backend/.env`.
**Ejecutar siempre desde `backend/`** (usan `dotenv` con el `.env` del directorio actual).

| Script | npm | Qué hace |
|---|---|---|
| `seed.js` | `npm run seed` | Carga datos de prueba (tiendas, productos). |
| `migrate.js` | `npm run db:migrate` | Aplica migraciones incrementales (columnas, tabla `coupons`, constraints). |
| `reset-db.js` | `npm run db:reset` | Reinicia la base de datos. ⚠️ Destructivo. |
| `create-admins.js` | `node scripts/create-admins.js` | Crea los usuarios administradores. |
| `create-brandon-store.js` | `node scripts/create-brandon-store.js` | Crea una tienda de ejemplo. |

> El esquema SQL base vive en [`../db/`](../db).
