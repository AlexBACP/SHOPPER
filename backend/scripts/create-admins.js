/**
 * SHOPPER — Crea (o actualiza) un Super Admin y un Admin
 *
 * Ejecutar desde C:\Users\asust\SHOPPER\backend:
 *   SUPERADMIN_PASSWORD=... ADMIN_PASSWORD=... node create-admins.js
 *
 * Las contraseñas se toman de variables de entorno (nunca se escriben en el
 * código ni se imprimen). Es idempotente: si el email ya existe, actualiza
 * su contraseña y rol.
 */

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt   = require('bcrypt');

const pool = new Pool({
  host:     process.env.DB_HOST     || '127.0.0.1',
  port:     parseInt(process.env.DB_PORT || '5432'),
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME     || 'shopperdb',
});

// ── Cuentas a crear ───────────────────────────────────────────────────────────
// Las contraseñas vienen de variables de entorno; nunca van escritas aquí.
const CUENTAS = [
  { name: 'Super Administrador', email: 'superadmin@shopper.co', password: process.env.SUPERADMIN_PASSWORD, role: 'super_admin' },
  { name: 'Administrador',       email: 'admin@shopper.co',      password: process.env.ADMIN_PASSWORD,      role: 'admin'       },
];

const faltantes = CUENTAS.filter(c => !c.password).map(c => c.role);
if (faltantes.length) {
  console.error('❌ Falta definir la contraseña en variables de entorno: ' +
    faltantes.map(r => r === 'super_admin' ? 'SUPERADMIN_PASSWORD' : 'ADMIN_PASSWORD').join(', '));
  console.error('   Ejemplo:  SUPERADMIN_PASSWORD=... ADMIN_PASSWORD=... node create-admins.js');
  process.exit(1);
}

async function run() {
  console.log('🔐 Creando cuentas de administración...\n');
  for (const c of CUENTAS) {
    const hash = await bcrypt.hash(c.password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email)
       DO UPDATE SET password_hash = EXCLUDED.password_hash,
                     role          = EXCLUDED.role,
                     name          = EXCLUDED.name,
                     updated_at    = NOW()
       RETURNING id, email, role`,
      [c.name, c.email, hash, c.role],
    );
    const u = rows[0];
    console.log(`  ✅ ${u.role.padEnd(11)} → ${u.email}  (id: ${u.id})`);
    console.log(`     contraseña: (definida por variable de entorno)\n`);
  }
  console.log('✅ Listo. Ya puedes iniciar sesión en /auth/login');
}

run()
  .catch(err => { console.error('❌ Error:', err.message); process.exit(1); })
  .finally(async () => { await pool.end(); });
