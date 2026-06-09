# 🚀 Deploy de SHOPPER con dominio (proyectoscampus.top)

Servidor: `185.245.182.220` · Dominio: `proyectoscampus.top` · API: `api.proyectoscampus.top`

Arquitectura: **Nginx** (puerto 80/443, SSL) → reverse proxy → contenedores Docker
(frontend `:3000`, backend `:3001`, Postgres/Mongo/Redis internos).

---

## 1. DNS — apuntar el dominio al servidor

En el panel de tu registrador (donde compraste `proyectoscampus.top`), crea **2 registros A**:

Servidor COMPARTIDO: cada proyecto vive en su propio subdominio.

| Tipo | Nombre / Host  | Valor (apunta a)   | TTL  |
|------|----------------|--------------------|------|
| A    | `shopper`      | `185.245.182.220`  | Auto |
| A    | `shopper-api`  | `185.245.182.220`  | Auto |

> Si el dominio ya tiene un comodín `*` → `185.245.182.220`, estos registros
> son opcionales (el comodín ya cubre cualquier subdominio).
> Verifica con: `nslookup shopper.proyectoscampus.top` (debe devolver `185.245.182.220`).

---

## 2. Conectarse al servidor

```bash
ssh root@185.245.182.220
# (te pedirá la contraseña root)
```

> 🔒 **Seguridad:** apenas termines, cambia la contraseña con `passwd` y considera
> configurar acceso por llave SSH. No dejes la clave root en chats/archivos.

---

## 3. Instalar dependencias en el servidor (Ubuntu/Debian)

```bash
# Actualizar
apt update && apt upgrade -y

# Docker + Docker Compose plugin
curl -fsSL https://get.docker.com | sh
docker --version && docker compose version

# Nginx + Certbot (SSL gratis con Let's Encrypt)
apt install -y nginx certbot python3-certbot-nginx git

# Firewall (deja SSH + HTTP + HTTPS)
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

---

## 4. Traer el código

```bash
cd /opt
git clone <URL_DE_TU_REPO> shopper   # o sube el código por scp/rsync
cd shopper
```

> Si no usas git, desde tu PC (Windows PowerShell):
> `scp -r C:\Users\asust\SHOPPER root@185.245.182.220:/opt/shopper`
> (excluye node_modules para que sea rápido)

---

## 5. Configurar variables de entorno (en el servidor)

### a) `.env` de la raíz (lo lee docker-compose)

```bash
cp deploy/.env.prod.example .env
nano .env
```
Rellena `DB_PASSWORD` con una contraseña fuerte y deja las URLs con tu dominio.

### b) `backend/.env` (secretos de la app)

```bash
cp backend/.env.example backend/.env
nano backend/.env
```
Valores **críticos** para producción:

```ini
NODE_ENV=production
DB_PASSWORD=...        # ⚠️ DEBE SER IGUAL al DB_PASSWORD del .env de la raíz
DB_NAME=shopperdb
FRONTEND_URL=https://proyectoscampus.top
BACKEND_URL=https://api.proyectoscampus.top

JWT_SECRET=<genera uno largo>          # node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_REFRESH_SECRET=<genera otro>

# Tus claves reales:
CLOUDINARY_*, RESEND_API_KEY, GEMINI_API_KEY, WOMPI_*, GOOGLE_*, FACEBOOK_*
```

> ⚠️ **Importante:** `DB_PASSWORD` en `.env` (raíz) y en `backend/.env` deben coincidir,
> porque el contenedor de Postgres se crea con el de la raíz y el backend se conecta con el suyo.

---

## 6. Levantar los contenedores (modo producción)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

# Ver estado y logs
docker compose ps
docker compose logs -f backend
```

Comprueba localmente en el servidor:
```bash
curl http://127.0.0.1:3000      # frontend responde
curl http://127.0.0.1:3001      # backend responde
```

> ¿La base de datos necesita seed/migración inicial? Mira los scripts del backend
> (`seed`, `migrate`). Ej: `docker compose exec backend node dist/seed.js` (ajusta al script real).

---

## 7. Configurar Nginx

```bash
cp deploy/nginx/proyectoscampus.conf /etc/nginx/sites-available/shopper
ln -s /etc/nginx/sites-available/shopper /etc/nginx/sites-enabled/
# NO borres el default ni otros sites: hay más proyectos en este servidor

nginx -t            # valida la sintaxis
systemctl reload nginx
```

Ahora `http://proyectoscampus.top` ya debería mostrar el sitio (sin candado todavía).

---

## 8. Activar HTTPS (SSL gratis con Let's Encrypt)

```bash
certbot --nginx -d shopper.proyectoscampus.top -d shopper-api.proyectoscampus.top
```
- Pon tu email, acepta los términos.
- Elige **redirigir HTTP → HTTPS** cuando pregunte.

Certbot edita el Nginx solo y configura la renovación automática. Verifícala con:
```bash
certbot renew --dry-run
```

✅ Listo: `https://proyectoscampus.top` con candado y la API en `https://api.proyectoscampus.top`.

---

## 9. Actualizaciones futuras

```bash
cd /opt/shopper
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

---

## ⚠️ Notas / gotchas

- **`NEXT_PUBLIC_API_URL` se hornea en el build.** Si cambias el dominio de la API,
  hay que **reconstruir** el frontend (`up --build`), no basta reiniciar.
- **CORS** ahora lee `FRONTEND_URL` (puedes poner varias separadas por coma).
- **OAuth (Google/Facebook):** actualiza las *Authorized redirect URIs* en sus consolas
  para que usen `https://api.proyectoscampus.top/...` y `https://proyectoscampus.top/...`.
- **Wompi:** cambia a llaves de producción y configura el webhook con la URL pública.
- Los puertos 3000/3001/5432/27017/6379 NO deben quedar abiertos al exterior;
  el firewall (paso 3) solo deja 22/80/443. Nginx hace de única puerta de entrada.
