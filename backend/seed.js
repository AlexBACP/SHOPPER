/**
 * SHOPPER — Script de datos de prueba
 * Crea 1 owner + 3 tiendas + 12 productos cada una
 *
 * Ejecutar desde C:\SHOPPER\backend:
 *   node seed.js
 *
 * Para limpiar todo lo creado:
 *   node seed.js --clean
 */

const { Pool }      = require('pg');
const { MongoClient } = require('mongodb');
const bcrypt        = require('bcrypt');

// ── Conexiones ────────────────────────────────────────────────────────────────
const pool = new Pool({
  host:     '127.0.0.1',
  port:     5432,
  user:     'postgres',
  password: '2203Alex',
  database: 'shopperdb',
});

const mongoClient = new MongoClient('mongodb://127.0.0.1:27017');
const MONGO_DB    = 'shopper_db';

// ── Helpers ───────────────────────────────────────────────────────────────────
const img  = (seed, w = 600, h = 600) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
const slug = (str) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

// ── Datos de las tiendas ──────────────────────────────────────────────────────
const TIENDAS = [
  {
    name:        'TechZone [PRUEBA]',
    slug:        'techzone-prueba',
    categoria:   'tecnologia',
    description: 'Los mejores gadgets y accesorios tecnológicos. Tienda de prueba — no realizar pedidos reales.',
    logo_url:    img('techzone-logo', 200, 200),
    productos: [
      { title: 'Laptop Ultrabook 14" [PRUEBA]',       sku: 'TZ-LAP-001', price: 2_890_000, comparePrice: 3_600_000, stock: 8,  desc: 'Procesador i7, 16GB RAM, SSD 512GB. Producto de prueba.',          seeds: ['laptop-1','laptop-2'] },
      { title: 'Smartphone 5G 256GB [PRUEBA]',        sku: 'TZ-PHN-001', price: 1_750_000, comparePrice: 2_190_000, stock: 15, desc: 'Pantalla AMOLED 6.7", batería 5000mAh. Producto de prueba.',       seeds: ['phone-1','phone-2'] },
      { title: 'Audífonos Bluetooth ANC [PRUEBA]',    sku: 'TZ-AUD-001', price:   389_000, comparePrice:   520_000, stock: 25, desc: 'Cancelación activa de ruido, 30h batería. Producto de prueba.',    seeds: ['headphones-1','headphones-2'] },
      { title: 'Tablet 10" 128GB [PRUEBA]',           sku: 'TZ-TAB-001', price:   920_000,                         stock: 10, desc: 'Pantalla IPS Full HD, stylus incluido. Producto de prueba.',       seeds: ['tablet-1','tablet-2'] },
      { title: 'Monitor 27" 4K [PRUEBA]',             sku: 'TZ-MON-001', price: 1_280_000, comparePrice: 1_600_000, stock: 6,  desc: 'Panel IPS, 144Hz, HDR400, USB-C. Producto de prueba.',             seeds: ['monitor-1','monitor-2'] },
      { title: 'Teclado Mecánico RGB [PRUEBA]',       sku: 'TZ-TEC-001', price:   245_000,                         stock: 20, desc: 'Switches Blue, retroiluminación RGB. Producto de prueba.',         seeds: ['keyboard-1','keyboard-2'] },
      { title: 'Mouse Gamer 16000DPI [PRUEBA]',       sku: 'TZ-MOU-001', price:   189_000,                         stock: 30, desc: '7 botones programables, peso ajustable. Producto de prueba.',      seeds: ['mouse-1','mouse-2'] },
      { title: 'Cámara Mirrorless 24MP [PRUEBA]',     sku: 'TZ-CAM-001', price: 3_450_000, comparePrice: 4_600_000, stock: 4,  desc: 'Lente 18-55mm, video 4K, estabilizador. Producto de prueba.',     seeds: ['camera-1','camera-2'] },
      { title: 'Parlante Bluetooth 360° [PRUEBA]',    sku: 'TZ-SPK-001', price:   275_000,                         stock: 18, desc: 'Resistente al agua IPX7, 24h batería. Producto de prueba.',        seeds: ['speaker-1','speaker-2'] },
      { title: 'Smartwatch GPS Deportivo [PRUEBA]',   sku: 'TZ-WAT-001', price:   650_000, comparePrice:   850_000, stock: 12, desc: 'Monitor cardíaco, SpO2, 50+ modos deporte. Producto de prueba.',  seeds: ['smartwatch-1','smartwatch-2'] },
      { title: 'Cargador Inalámbrico 20W [PRUEBA]',   sku: 'TZ-CHG-001', price:    89_000,                         stock: 40, desc: 'Compatible Qi, carga rápida, pad doble. Producto de prueba.',      seeds: ['charger-1','charger-2'] },
      { title: 'Funda Laptop 15" Premium [PRUEBA]',   sku: 'TZ-CAS-001', price:    75_000,                         stock: 35, desc: 'Neopreno acolchado, bolsillos extra. Producto de prueba.',         seeds: ['bag-1','bag-2'] },
    ],
  },
  {
    name:        'Moda Urbana [PRUEBA]',
    slug:        'moda-urbana-prueba',
    categoria:   'moda',
    description: 'Ropa y accesorios con estilo urbano contemporáneo. Tienda de prueba — no realizar pedidos reales.',
    logo_url:    img('moda-logo', 200, 200),
    productos: [
      { title: 'Camiseta Oversize Algodón [PRUEBA]',  sku: 'MU-CAM-001', price:    85_000,                         stock: 50, desc: '100% algodón pima, tallas XS-XXL. Producto de prueba.',            seeds: ['tshirt-1','tshirt-2'] },
      { title: 'Jean Skinny Elastizado [PRUEBA]',     sku: 'MU-JEA-001', price:   195_000, comparePrice:   260_000, stock: 30, desc: 'Mezclilla con elastano, corte moderno. Producto de prueba.',       seeds: ['jeans-1','jeans-2'] },
      { title: 'Zapatillas Running Lite [PRUEBA]',    sku: 'MU-ZAP-001', price:   320_000, comparePrice:   430_000, stock: 22, desc: 'Suela de goma, plantilla ergonómica. Producto de prueba.',         seeds: ['shoes-1','shoes-2'] },
      { title: 'Chaqueta Bomber Unisex [PRUEBA]',     sku: 'MU-CHA-001', price:   285_000, comparePrice:   380_000, stock: 15, desc: 'Poliéster reciclado, forro polar. Producto de prueba.',            seeds: ['jacket-1','jacket-2'] },
      { title: 'Vestido Midi Floral [PRUEBA]',        sku: 'MU-VES-001', price:   165_000, comparePrice:   220_000, stock: 20, desc: 'Viscosa fresca, estampado floral. Producto de prueba.',            seeds: ['dress-1','dress-2'] },
      { title: 'Gorra Snapback [PRUEBA]',             sku: 'MU-GOR-001', price:    65_000,                         stock: 45, desc: 'Ajuste trasero, bordado frontal. Producto de prueba.',             seeds: ['cap-1','cap-2'] },
      { title: 'Bolso Tote Canvas [PRUEBA]',          sku: 'MU-BOL-001', price:   120_000, comparePrice:   160_000, stock: 28, desc: 'Lona resistente, asas reforzadas 40L. Producto de prueba.',        seeds: ['totebag-1','totebag-2'] },
      { title: 'Cinturón Cuero Genuino [PRUEBA]',     sku: 'MU-CIN-001', price:    95_000,                         stock: 35, desc: 'Cuero legítimo, hebilla metálica dorada. Producto de prueba.',     seeds: ['belt-1','belt-2'] },
      { title: 'Gafas UV400 Polarizadas [PRUEBA]',    sku: 'MU-GAF-001', price:   115_000,                         stock: 40, desc: 'Protección UV400, montura acetato. Producto de prueba.',           seeds: ['sunglasses-1','sunglasses-2'] },
      { title: 'Reloj Análogo Clásico [PRUEBA]',      sku: 'MU-REL-001', price:   245_000,                         stock: 18, desc: 'Acero inoxidable, correa cuero, sumergible. Producto de prueba.', seeds: ['watch-1','watch-2'] },
      { title: 'Sudadera Hoodie Fleece [PRUEBA]',     sku: 'MU-SUD-001', price:   175_000, comparePrice:   240_000, stock: 25, desc: 'Algodón fleece 380g, capucha ajustable. Producto de prueba.',      seeds: ['hoodie-1','hoodie-2'] },
      { title: 'Pantalón Cargo Relaxed [PRUEBA]',     sku: 'MU-PAN-001', price:   210_000,                         stock: 20, desc: '6 bolsillos, tela twill antirrugado. Producto de prueba.',         seeds: ['pants-1','pants-2'] },
    ],
  },
  {
    name:        'Casa & Deco [PRUEBA]',
    slug:        'casa-deco-prueba',
    categoria:   'hogar',
    description: 'Artículos para el hogar con diseño moderno y funcional. Tienda de prueba — no realizar pedidos reales.',
    logo_url:    img('casa-logo', 200, 200),
    productos: [
      { title: 'Set Cojines Lino x3 [PRUEBA]',        sku: 'CD-COJ-001', price:   145_000,                         stock: 20, desc: 'Funda lino lavable, relleno fibra siliconada. Producto de prueba.', seeds: ['pillow-1','pillow-2'] },
      { title: 'Lámpara de Piso Nórdica [PRUEBA]',    sku: 'CD-LAM-001', price:   380_000, comparePrice:   500_000, stock: 8,  desc: 'Pantalla tela, base madera, E27 incluida. Producto de prueba.',     seeds: ['lamp-1','lamp-2'] },
      { title: 'Cuadro Abstracto 60x40cm [PRUEBA]',   sku: 'CD-CUA-001', price:   185_000, comparePrice:   245_000, stock: 12, desc: 'Impresión giclée, marco madera nogal. Producto de prueba.',         seeds: ['painting-1','painting-2'] },
      { title: 'Espejo Redondo 60cm [PRUEBA]',        sku: 'CD-ESP-001', price:   265_000, comparePrice:   350_000, stock: 10, desc: 'Marco metálico dorado, colgante incluido. Producto de prueba.',     seeds: ['mirror-1','mirror-2'] },
      { title: 'Maceta Cerámica Set x2 [PRUEBA]',     sku: 'CD-MAC-001', price:    95_000, comparePrice:   130_000, stock: 30, desc: 'Cerámica esmaltada, diseño artesanal. Producto de prueba.',         seeds: ['plant-1','plant-2'] },
      { title: 'Velas Aromáticas x4 [PRUEBA]',        sku: 'CD-VEL-001', price:    75_000,                         stock: 45, desc: 'Cera de soya, aromas: vainilla, lavanda, cedro, coco. Producto de prueba.', seeds: ['candle-1','candle-2'] },
      { title: 'Jarrón Minimalista 30cm [PRUEBA]',    sku: 'CD-JAR-001', price:   125_000,                         stock: 15, desc: 'Cerámica mate, cuello estrecho, beige natural. Producto de prueba.', seeds: ['vase-1','vase-2'] },
      { title: 'Alfombra Boho 120x80cm [PRUEBA]',     sku: 'CD-ALF-001', price:   345_000, comparePrice:   460_000, stock: 7,  desc: 'Algodón tejido, patrón geométrico. Producto de prueba.',             seeds: ['rug-1','rug-2'] },
      { title: 'Organizador Bambú 3 Niveles [PRUEBA]', sku: 'CD-ORG-001', price:  110_000,                         stock: 22, desc: 'Bambú natural, multiusos escritorio/baño. Producto de prueba.',      seeds: ['organizer-1','organizer-2'] },
      { title: 'Marco Fotos Madera x5 [PRUEBA]',      sku: 'CD-MAR-001', price:    98_000,                         stock: 25, desc: 'Madera pino barnizado, formatos 10x15 y 13x18. Producto de prueba.', seeds: ['frame-1','frame-2'] },
      { title: 'Reloj de Pared Moderno [PRUEBA]',     sku: 'CD-REL-001', price:   155_000,                         stock: 18, desc: 'Mecanismo silencioso, metal negro Ø40cm. Producto de prueba.',        seeds: ['clock-1','clock-2'] },
      { title: 'Mantel Lino Redondo 150cm [PRUEBA]',  sku: 'CD-MAN-001', price:    85_000,                         stock: 30, desc: 'Lino lavable a máquina, varios colores. Producto de prueba.',         seeds: ['tablecloth-1','tablecloth-2'] },
    ],
  },
];

// ── Lógica principal ──────────────────────────────────────────────────────────
async function seed() {
  const isClean = process.argv.includes('--clean');
  await mongoClient.connect();
  const db = mongoClient.db(MONGO_DB);

  if (isClean) {
    console.log('🧹 Limpiando datos de prueba...');
    // Obtener IDs de tiendas de prueba
    const { rows: stores } = await pool.query(
      `SELECT id FROM stores WHERE slug LIKE '%-prueba'`
    );
    const storeIds = stores.map(s => s.id);

    if (storeIds.length) {
      // Eliminar productos de MongoDB
      const result = await db.collection('products').deleteMany({
        store_id: { $in: storeIds }
      });
      console.log(`   Productos eliminados: ${result.deletedCount}`);
      // Eliminar tiendas de PostgreSQL (CASCADE elimina order_items + orders también)
      await pool.query(`DELETE FROM stores WHERE id = ANY($1)`, [storeIds]);
      console.log(`   Tiendas eliminadas: ${storeIds.length}`);
    }

    // Eliminar owner de prueba
    await pool.query(`DELETE FROM users WHERE email = 'owner.prueba@shopper.co'`);
    console.log('   Usuario de prueba eliminado');
    console.log('✅ Limpieza completada');
    return;
  }

  console.log('🌱 Iniciando seed de datos de prueba...\n');

  // 1. Crear owner de prueba (o reutilizar si ya existe)
  const passwordHash = await bcrypt.hash('Prueba1234', 10);
  const { rows: existing } = await pool.query(
    `SELECT id FROM users WHERE email = 'owner.prueba@shopper.co'`
  );
  let ownerId;
  if (existing[0]) {
    ownerId = existing[0].id;
    console.log(`👤 Owner ya existe — reutilizando (${ownerId})`);
  } else {
    const { rows: ownerRows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'owner') RETURNING id`,
      ['Vendedor Prueba', 'owner.prueba@shopper.co', passwordHash]
    );
    ownerId = ownerRows[0].id;
    console.log(`👤 Owner creado — ID: ${ownerId}`);
  }
  console.log(`   Email: owner.prueba@shopper.co`);
  console.log(`   Contraseña: Prueba1234\n`);

  // 2. Crear tiendas y productos
  for (const tienda of TIENDAS) {
    // Verificar si la tienda ya existe
    const { rows: existingStore } = await pool.query(
      `SELECT id FROM stores WHERE slug = $1`, [tienda.slug]
    );
    let storeId;

    if (existingStore[0]) {
      storeId = existingStore[0].id;
      console.log(`🏪 Tienda ya existe: "${tienda.name}" — reutilizando`);
    } else {
      const { rows: storeRows } = await pool.query(
        `INSERT INTO stores (owner_id, name, slug, description, logo_url, is_published)
         VALUES ($1, $2, $3, $4, $5, true) RETURNING id`,
        [ownerId, tienda.name, tienda.slug, tienda.description, tienda.logo_url]
      );
      storeId = storeRows[0].id;
      console.log(`🏪 Tienda creada: "${tienda.name}" (${storeId})`);
    }

    // Verificar si ya tiene productos
    const existingProducts = await db.collection('products')
      .countDocuments({ store_id: storeId });

    if (existingProducts > 0) {
      console.log(`   ⚠️  Ya tiene ${existingProducts} productos — omitiendo`);
    } else {
      const now = new Date();
      const docs = tienda.productos.map(p => ({
        store_id:    storeId,
        title:       p.title,
        sku:         p.sku,
        category:    tienda.categoria,
        price:       p.price,
        ...(p.comparePrice && { compare_at_price: p.comparePrice }),
        stock:       p.stock,
        description: p.desc,
        images:      p.seeds.map(s => img(s)),
        variants:    [],
        attributes:  { prueba: 'true' },
        is_active:   true,
        created_at:  now,
        updated_at:  now,
      }));

      await db.collection('products').insertMany(docs);
      console.log(`   ✅ ${docs.length} productos insertados`);
    }

    console.log(`   🔗 URL: http://localhost:3000/store/${tienda.slug}\n`);
  }

  // ── Patch compare_at_price para productos ya existentes ──────────────────
  const COMPARE_PRICES = {
    'TZ-LAP-001': 3_600_000, 'TZ-PHN-001': 2_190_000, 'TZ-AUD-001':   520_000,
    'TZ-MON-001': 1_600_000, 'TZ-CAM-001': 4_600_000, 'TZ-WAT-001':   850_000,
    'MU-JEA-001':   260_000, 'MU-ZAP-001':   430_000, 'MU-CHA-001':   380_000,
    'MU-VES-001':   220_000, 'MU-BOL-001':   160_000, 'MU-SUD-001':   240_000,
    'CD-LAM-001':   500_000, 'CD-CUA-001':   245_000, 'CD-ESP-001':   350_000,
    'CD-ALF-001':   460_000, 'CD-MAC-001':   130_000,
  };
  // ── Patch category para productos ya existentes ──────────────────────────
  console.log('\n🏷️  Aplicando categorías a productos existentes...');
  const CATEGORY_PATCHES = [
    { prefix: 'TZ-', category: 'tecnologia' },
    { prefix: 'MU-', category: 'moda'       },
    { prefix: 'CD-', category: 'hogar'      },
  ];
  let catCount = 0;
  for (const { prefix, category } of CATEGORY_PATCHES) {
    const res = await db.collection('products').updateMany(
      { sku: { $regex: `^${prefix}` } },
      { $set: { category } },
    );
    catCount += res.modifiedCount;
  }
  console.log(`   ✅ ${catCount || 'Ya aplicadas —'} productos actualizados`);

  // ── Patch compare_at_price para productos ya existentes ──────────────────
  console.log('\n💰 Aplicando precios originales (compare_at_price)...');
  let patchCount = 0;
  for (const [sku, comparePrice] of Object.entries(COMPARE_PRICES)) {
    const res = await db.collection('products').updateMany(
      { sku }, { $set: { compare_at_price: comparePrice } },
    );
    patchCount += res.modifiedCount;
  }
  console.log(`   ✅ ${patchCount || 'Ya aplicados —'} productos actualizados`);

  console.log('─'.repeat(55));
  console.log('✅ Seed completado\n');
  console.log('CREDENCIALES DEL OWNER DE PRUEBA:');
  console.log('  Email:      owner.prueba@shopper.co');
  console.log('  Contraseña: Prueba1234\n');
  console.log('TIENDAS DISPONIBLES:');
  TIENDAS.forEach(t => {
    console.log(`  http://localhost:3000/store/${t.slug}`);
  });
  console.log('─'.repeat(55));
}

seed()
  .catch(err => { console.error('❌ Error:', err.message); process.exit(1); })
  .finally(async () => {
    await pool.end();
    await mongoClient.close();
  });
