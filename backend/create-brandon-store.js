/**
 * SHOPPER — Crea un vendedor de prueba (Brandon) con tienda publicada y productos
 *
 * Ejecutar desde C:\Users\asust\SHOPPER\backend:
 *   node create-brandon-store.js
 *
 * Idempotente:
 *   - El usuario se crea/actualiza por email.
 *   - La tienda se crea/reutiliza por slug.
 *   - Los productos solo se insertan si la tienda aún no tiene.
 */

require('dotenv').config();
const { Pool }        = require('pg');
const { MongoClient } = require('mongodb');
const bcrypt          = require('bcrypt');

const pool = new Pool({
  host:     process.env.DB_HOST     || '127.0.0.1',
  port:     parseInt(process.env.DB_PORT || '5432'),
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME     || 'shopperdb',
});
const mongoClient = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopper_db');

const img = (seed) => `https://picsum.photos/seed/${seed}/600/600`;

// ── Datos del vendedor y la tienda ────────────────────────────────────────────
// La contraseña viene de variable de entorno; nunca va escrita aquí.
const VENDEDOR = { name: 'Brandon', email: 'brandon@gmail.com', password: process.env.BRANDON_PASSWORD };
if (!VENDEDOR.password) {
  console.error('❌ Falta definir BRANDON_PASSWORD en variables de entorno.');
  console.error('   Ejemplo:  BRANDON_PASSWORD=... node create-brandon-store.js');
  process.exit(1);
}
const TIENDA = {
  name:        'TecnoBrandon',
  slug:        'tecnobrandon',
  categoria:   'tecnologia',
  description: 'Tecnología y accesorios de calidad al mejor precio. Envíos a toda Colombia.',
  logo_url:    img('tecnobrandon-logo'),
};
const PRODUCTOS = [
  { title: 'Audífonos Inalámbricos Pro ANC', sku: 'TB-AUD-001', price: 189_000, compare: 240_000, stock: 30, desc: 'Cancelación activa de ruido, 30 h de batería, Bluetooth 5.3, estuche de carga.', seeds: ['tb-audifonos', 'tb-audifonos-2'] },
  { title: 'Reloj Inteligente Fit GPS',      sku: 'TB-WAT-001', price: 320_000, compare: 420_000, stock: 18, desc: 'Monitor cardíaco, SpO2, GPS integrado, más de 50 modos deportivos, sumergible.', seeds: ['tb-reloj', 'tb-reloj-2'] },
  { title: 'Teclado Mecánico RGB TKL',       sku: 'TB-TEC-001', price: 245_000,                  stock: 25, desc: 'Switches táctiles, retroiluminación RGB por tecla, formato compacto, USB-C.', seeds: ['tb-teclado', 'tb-teclado-2'] },
  { title: 'Mouse Gamer Inalámbrico 16K',    sku: 'TB-MOU-001', price: 159_000,                  stock: 40, desc: 'Sensor óptico 16.000 DPI, 7 botones programables, hasta 70 h de batería.', seeds: ['tb-mouse', 'tb-mouse-2'] },
  { title: 'Parlante Bluetooth 360° IPX7',   sku: 'TB-SPK-001', price: 210_000, compare: 280_000, stock: 22, desc: 'Sonido envolvente 360°, resistente al agua IPX7, 24 h de reproducción.', seeds: ['tb-parlante', 'tb-parlante-2'] },
  { title: 'Cargador GaN 65W 3 Puertos',     sku: 'TB-CHG-001', price: 145_000,                  stock: 50, desc: '2 USB-C + 1 USB-A, carga rápida simultánea, tecnología GaN ultracompacta.', seeds: ['tb-cargador', 'tb-cargador-2'] },
  { title: 'Webcam Full HD 1080p',           sku: 'TB-WEB-001', price: 199_000,                  stock: 15, desc: 'Autofoco, micrófono estéreo con reducción de ruido, clip universal, plug & play.', seeds: ['tb-webcam', 'tb-webcam-2'] },
  { title: 'Power Bank 20.000 mAh 65W',      sku: 'TB-PWR-001', price: 175_000, compare: 230_000, stock: 35, desc: '3 puertos, carga rápida 65 W, pantalla LED de batería, ideal para laptop.', seeds: ['tb-powerbank', 'tb-powerbank-2'] },
];

async function run() {
  await mongoClient.connect();
  const db = mongoClient.db(); // usa la BD del MONGODB_URI (shopper_db) — igual que la app

  console.log('🛍️  Creando vendedor + tienda de prueba para Brandon...\n');

  // 1. Usuario vendedor (owner)
  const hash = await bcrypt.hash(VENDEDOR.password, 10);
  const { rows: userRows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'owner')
     ON CONFLICT (email)
     DO UPDATE SET password_hash = EXCLUDED.password_hash,
                   role          = 'owner',
                   name          = EXCLUDED.name,
                   updated_at     = NOW()
     RETURNING id`,
    [VENDEDOR.name, VENDEDOR.email, hash],
  );
  const ownerId = userRows[0].id;
  console.log(`👤 Vendedor → ${VENDEDOR.email} / (contraseña definida por variable de entorno)  (id: ${ownerId})`);

  // 2. Tienda (publicada)
  const { rows: ex } = await pool.query('SELECT id FROM stores WHERE slug = $1', [TIENDA.slug]);
  let storeId;
  if (ex[0]) {
    storeId = ex[0].id;
    await pool.query(
      'UPDATE stores SET owner_id = $1, is_published = true, name = $2, description = $3, logo_url = $4 WHERE id = $5',
      [ownerId, TIENDA.name, TIENDA.description, TIENDA.logo_url, storeId],
    );
    console.log(`🏪 Tienda ya existía — actualizada: "${TIENDA.name}"`);
  } else {
    const { rows } = await pool.query(
      `INSERT INTO stores (owner_id, name, slug, description, logo_url, is_published)
       VALUES ($1, $2, $3, $4, $5, true) RETURNING id`,
      [ownerId, TIENDA.name, TIENDA.slug, TIENDA.description, TIENDA.logo_url],
    );
    storeId = rows[0].id;
    console.log(`🏪 Tienda creada: "${TIENDA.name}"`);
  }

  // 3. Productos (Mongo) — solo si la tienda no tiene aún
  const existentes = await db.collection('products').countDocuments({ store_id: storeId });
  if (existentes > 0) {
    console.log(`📦 La tienda ya tiene ${existentes} productos — no se insertan duplicados.`);
  } else {
    const now = new Date();
    const docs = PRODUCTOS.map(p => ({
      store_id:    storeId,
      title:       p.title,
      sku:         p.sku,
      category:    TIENDA.categoria,
      price:       p.price,
      ...(p.compare && { compare_at_price: p.compare }),
      stock:       p.stock,
      description: p.desc,
      images:      p.seeds.map(img),
      variants:    [],
      attributes:  {},
      is_active:   true,
      created_at:  now,
      updated_at:  now,
    }));
    await db.collection('products').insertMany(docs);
    console.log(`📦 ${docs.length} productos insertados.`);
  }

  console.log('\n' + '─'.repeat(56));
  console.log('✅ Listo. Inicia sesión como vendedor:');
  console.log(`   ${VENDEDOR.email}  /  (contraseña definida por variable de entorno)`);
  console.log(`   Tienda pública:  /store/${TIENDA.slug}`);
  console.log('─'.repeat(56));
}

run()
  .catch(err => { console.error('❌ Error:', err.message); process.exit(1); })
  .finally(async () => { await pool.end(); await mongoClient.close(); });
