# Esquema de base de datos (backend)

SQL base de PostgreSQL para el proyecto.

| Archivo | Qué es |
|---|---|
| `setup.sql` | Creación inicial del esquema (tablas, índices). |
| `migrations.sql` | Cambios incrementales sobre el esquema. |

Las migraciones incrementales también se aplican vía script:
`npm run db:migrate` (ver [`../scripts`](../scripts)).
