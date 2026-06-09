# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────
#  SHOPPER · Backend (NestJS) — Multi-stage Dockerfile
# ─────────────────────────────────────────────────────────────

# 1) Dependencias completas (cache amistosa)
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund

# 2) Imagen de desarrollo (hot reload con nest start --watch)
FROM node:20-bookworm-slim AS dev
WORKDIR /app
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3001
CMD ["npm", "run", "start:dev"]

# 3) Build de producción
FROM node:20-bookworm-slim AS build
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 4) Imagen final ligera de producción (solo prod deps + dist)
FROM node:20-bookworm-slim AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps --no-audit --no-fund && npm cache clean --force
COPY --from=build /app/dist ./dist
# Scripts de inicialización/seed de la BD (migrate, create-admins, seed) y el SQL
COPY scripts ./scripts
COPY db ./db
EXPOSE 3001
CMD ["node", "dist/main"]
