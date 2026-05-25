/**
 * SHOPPER — Script de datos de prueba
 * Crea 2 owners + 10 tiendas + ~10 productos cada una
 *
 * Ejecutar desde C:\SHOPPER\backend:
 *   node seed.js
 *
 * Para limpiar todo lo creado:
 *   node seed.js --clean
 */

const { Pool }        = require('pg');
const { MongoClient } = require('mongodb');
const bcrypt          = require('bcrypt');

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
const img = (seed, w = 600, h = 600) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

// ── Datos de las 10 tiendas ───────────────────────────────────────────────────
const TIENDAS = [

  // ── 1. TECNOLOGÍA ────────────────────────────────────────────────────────
  {
    name:        'TechZone [PRUEBA]',
    slug:        'techzone-prueba',
    categoria:   'tecnologia',
    description: 'Los mejores gadgets y accesorios tecnológicos. Tienda de prueba.',
    logo_url:    img('techzone-logo', 200, 200),
    owner:       1,
    productos: [
      { title: 'Laptop Ultrabook 14"',     sku: 'TZ-LAP-001', price: 2_890_000, compare: 3_600_000, stock: 8,  desc: 'Procesador i7, 16 GB RAM, SSD 512 GB, pantalla IPS Full HD.',          seeds: ['laptop-silver','laptop-open'] },
      { title: 'Smartphone 5G 256 GB',     sku: 'TZ-PHN-001', price: 1_750_000, compare: 2_190_000, stock: 15, desc: 'Pantalla AMOLED 6.7", cámara triple 108 MP, batería 5000 mAh.',        seeds: ['smartphone-black','phone-flat'] },
      { title: 'Audífonos Bluetooth ANC',  sku: 'TZ-AUD-001', price:   389_000, compare:   520_000, stock: 25, desc: 'Cancelación activa de ruido, 30 h batería, plegables.',                 seeds: ['headphones-white','headphones-desk'] },
      { title: 'Monitor 27" 4K IPS',       sku: 'TZ-MON-001', price: 1_280_000, compare: 1_600_000, stock: 6,  desc: 'Panel IPS, 144 Hz, HDR400, USB-C 65 W, 3 puertos USB.',                seeds: ['monitor-dark','monitor-setup'] },
      { title: 'Teclado Mecánico RGB',     sku: 'TZ-TEC-001', price:   245_000,                     stock: 20, desc: 'Switches tactiles, retroiluminación RGB por tecla, TKL.',               seeds: ['keyboard-rgb','keyboard-white'] },
      { title: 'Mouse Gamer 16000 DPI',    sku: 'TZ-MOU-001', price:   189_000,                     stock: 30, desc: '7 botones programables, sensor óptico de alta precisión.',              seeds: ['mouse-gaming','mouse-black'] },
      { title: 'Tablet 10" 128 GB',        sku: 'TZ-TAB-001', price:   920_000,                     stock: 10, desc: 'Pantalla IPS, stylus incluido, batería 8000 mAh, 4G LTE.',             seeds: ['tablet-hand','tablet-flat'] },
      { title: 'Smartwatch GPS Sport',     sku: 'TZ-WAT-001', price:   650_000, compare:   850_000, stock: 12, desc: 'Monitor cardíaco, SpO2, GPS, más de 50 modos deportivos.',              seeds: ['smartwatch-sport','watch-wrist'] },
      { title: 'Cámara Mirrorless 24 MP',  sku: 'TZ-CAM-001', price: 3_450_000, compare: 4_600_000, stock: 4,  desc: 'Lente 18-55 mm kit, vídeo 4K, IBIS, pantalla táctil giratoria.',       seeds: ['camera-mirrorless','camera-lens'] },
      { title: 'Parlante Bluetooth 360°',  sku: 'TZ-SPK-001', price:   275_000,                     stock: 18, desc: 'Sonido 360°, IPX7, 24 h batería, micrófono integrado.',                 seeds: ['speaker-blue','speaker-outdoor'] },
    ],
  },

  // ── 2. MODA ──────────────────────────────────────────────────────────────
  {
    name:        'Moda Urbana [PRUEBA]',
    slug:        'moda-urbana-prueba',
    categoria:   'moda',
    description: 'Ropa y accesorios con estilo urbano contemporáneo. Tienda de prueba.',
    logo_url:    img('fashion-logo', 200, 200),
    owner:       1,
    productos: [
      { title: 'Camiseta Oversize Algodón', sku: 'MU-CAM-001', price:    85_000,               stock: 50, desc: '100 % algodón pima, corte holgado, tallas XS-XXL, 12 colores.',          seeds: ['tshirt-white','tshirt-model'] },
      { title: 'Jean Skinny Elastizado',    sku: 'MU-JEA-001', price:   195_000, compare: 260_000, stock: 30, desc: 'Mezclilla con elastano 4 %, corte tobillero, tiro medio.',         seeds: ['jeans-blue','jeans-model'] },
      { title: 'Zapatillas Running Lite',   sku: 'MU-ZAP-001', price:   320_000, compare: 430_000, stock: 22, desc: 'Suela EVA, plantilla ergonómica, tallas 35-45, 6 colores.',         seeds: ['shoes-white','shoes-running'] },
      { title: 'Chaqueta Bomber Unisex',    sku: 'MU-CHA-001', price:   285_000, compare: 380_000, stock: 15, desc: 'Poliéster reciclado, forro polar, ribetes elásticos, S-XL.',         seeds: ['jacket-black','jacket-model'] },
      { title: 'Vestido Midi Floral',       sku: 'MU-VES-001', price:   165_000, compare: 220_000, stock: 20, desc: 'Viscosa fresca, estampado floral, escote V, cierre posterior.',      seeds: ['dress-floral','dress-model'] },
      { title: 'Sudadera Hoodie Fleece',    sku: 'MU-SUD-001', price:   175_000, compare: 240_000, stock: 25, desc: 'Algodón fleece 380 g, bolsillo canguro, capucha doble capa.',         seeds: ['hoodie-grey','hoodie-model'] },
      { title: 'Pantalón Cargo Relaxed',    sku: 'MU-PAN-001', price:   210_000,               stock: 20, desc: '6 bolsillos laterales, tela twill antirrugado, tiro alto.',              seeds: ['pants-cargo','pants-model'] },
      { title: 'Gorra Snapback Bordada',    sku: 'MU-GOR-001', price:    65_000,               stock: 45, desc: 'Ajuste trasero de plástico, bordado frontal 3D, talla única.',           seeds: ['cap-black','cap-model'] },
      { title: 'Bolso Tote Canvas Premium', sku: 'MU-BOL-001', price:   120_000, compare: 160_000, stock: 28, desc: 'Lona 12 oz resistente, asas cuero reforzado, capacidad 15 L.',      seeds: ['tote-bag','bag-canvas'] },
      { title: 'Gafas UV400 Polarizadas',   sku: 'MU-GAF-001', price:   115_000,               stock: 40, desc: 'Protección UV400, montura acetato, cristales policarbonato polarizados.', seeds: ['sunglasses-model','sunglasses-flat'] },
    ],
  },

  // ── 3. HOGAR ─────────────────────────────────────────────────────────────
  {
    name:        'Casa & Deco [PRUEBA]',
    slug:        'casa-deco-prueba',
    categoria:   'hogar',
    description: 'Artículos para el hogar con diseño moderno y funcional. Tienda de prueba.',
    logo_url:    img('home-logo', 200, 200),
    owner:       1,
    productos: [
      { title: 'Lámpara de Piso Nórdica',     sku: 'CD-LAM-001', price:   380_000, compare: 500_000, stock: 8,  desc: 'Pantalla de tela, base madera natural, compatible E27, 160 cm.',      seeds: ['lamp-floor','lamp-nordic'] },
      { title: 'Espejo Redondo 60 cm',         sku: 'CD-ESP-001', price:   265_000, compare: 350_000, stock: 10, desc: 'Marco metálico dorado bruñido, anclaje incluido, espesor 4 mm.',    seeds: ['mirror-round','mirror-wall'] },
      { title: 'Alfombra Boho 120×80 cm',      sku: 'CD-ALF-001', price:   345_000, compare: 460_000, stock: 7,  desc: 'Algodón tejido artesanal, patrón geométrico, antideslizante.',      seeds: ['rug-boho','rug-room'] },
      { title: 'Cuadro Abstracto 60×40 cm',    sku: 'CD-CUA-001', price:   185_000, compare: 245_000, stock: 12, desc: 'Impresión giclée sobre lienzo, marco madera nogal, listo colgar.',  seeds: ['art-abstract','painting-wall'] },
      { title: 'Set Cojines Lino x3',          sku: 'CD-COJ-001', price:   145_000,               stock: 20, desc: 'Funda lino lavable, relleno fibra siliconada, 45×45 cm, 8 colores.',  seeds: ['pillows-linen','cushion-sofa'] },
      { title: 'Maceta Cerámica Set x2',       sku: 'CD-MAC-001', price:    95_000, compare: 130_000, stock: 30, desc: 'Cerámica esmaltada artesanal, Ø14 cm y Ø10 cm, con plato.',       seeds: ['plant-ceramic','pot-white'] },
      { title: 'Reloj de Pared Minimalista',   sku: 'CD-REL-001', price:   155_000,               stock: 18, desc: 'Movimiento silencioso, metal negro, Ø 40 cm, pila AA incluida.',      seeds: ['clock-minimal','wall-clock'] },
      { title: 'Organizador Bambú 3 Niveles',  sku: 'CD-ORG-001', price:   110_000,               stock: 22, desc: 'Bambú natural tratado, 3 bandejas extraíbles, multiusos.',            seeds: ['organizer-wood','bamboo-shelf'] },
      { title: 'Velas Aromáticas Set x4',      sku: 'CD-VEL-001', price:    75_000,               stock: 45, desc: 'Cera de soya 100 %, aromas: vainilla, lavanda, cedro y coco.',        seeds: ['candles-set','candle-flame'] },
      { title: 'Jarrón Minimalista 30 cm',     sku: 'CD-JAR-001', price:   125_000,               stock: 15, desc: 'Cerámica mate, cuello estrecho, beige natural, base estable.',        seeds: ['vase-tall','vase-minimal'] },
    ],
  },

  // ── 4. DEPORTES ──────────────────────────────────────────────────────────
  {
    name:        'Deportes Total [PRUEBA]',
    slug:        'deportes-total-prueba',
    categoria:   'deportes',
    description: 'Equipos y ropa deportiva para todos los niveles. Tienda de prueba.',
    logo_url:    img('sports-logo', 200, 200),
    owner:       1,
    productos: [
      { title: 'Balón de Fútbol Pro',          sku: 'DT-BAL-001', price:   145_000, compare: 195_000,   stock: 30, desc: 'Cuero sintético PU, tamaño 5, costura a máquina, resistente al agua.',  seeds: ['soccer-ball','football-grass'] },
      { title: 'Bicicleta MTB Aluminio 29"',   sku: 'DT-BIC-001', price: 1_850_000, compare: 2_400_000, stock: 5,  desc: '21 velocidades Shimano, frenos disco hidráulico, horquilla suspensión.', seeds: ['mountain-bike','bike-trail'] },
      { title: 'Mancuernas Ajustables 20 kg',  sku: 'DT-MAN-001', price:   480_000, compare:   650_000, stock: 12, desc: 'Par 2-20 kg ajustable por palanca, base incluida, acero niquelado.',     seeds: ['dumbbells','gym-weights'] },
      { title: 'Colchoneta Yoga 6 mm',         sku: 'DT-COL-001', price:    95_000,                     stock: 40, desc: 'TPE ecológico, antideslizante doble cara, incluye correa transporte.',    seeds: ['yoga-mat','yoga-pose'] },
      { title: 'Raqueta Tenis Carbono',        sku: 'DT-RAQ-001', price:   395_000, compare:   520_000, stock: 10, desc: 'Grafito 100 %, 285 g, cabeza 100 in², encordado incluido, grip 3.',      seeds: ['tennis-racket','tennis-court'] },
      { title: 'Guantes Boxeo 16 oz',          sku: 'DT-GUA-001', price:   185_000,                     stock: 20, desc: 'Cuero sintético premium, relleno espuma densidad dual, cierre velcro.',  seeds: ['boxing-gloves','boxing-red'] },
      { title: 'Cuerda para Saltar Speed',     sku: 'DT-CRD-001', price:    45_000,                     stock: 60, desc: 'Cable acero forrado PVC, mangos aluminio, ajustable 3 m, contador.',     seeds: ['jump-rope','skipping-rope'] },
      { title: 'Camiseta Deportiva Dri-Fit',   sku: 'DT-CAM-001', price:    79_000,                     stock: 50, desc: 'Poliéster técnico secado rápido, UPF 30, tallas XS-XXL, 8 colores.',     seeds: ['sport-shirt','running-shirt'] },
      { title: 'Botella Térmica 750 ml',       sku: 'DT-BOT-001', price:    65_000,                     stock: 35, desc: 'Acero inoxidable 18/8, doble pared, mantiene frío 24 h / calor 12 h.',   seeds: ['water-bottle','bottle-sport'] },
      { title: 'Rodilleras Profesionales x2',  sku: 'DT-ROD-001', price:    58_000,                     stock: 45, desc: 'Neopreno 7 mm, tiras antideslizantes, tallas S-XL, unisex.',             seeds: ['knee-pads','sports-protection'] },
    ],
  },

  // ── 5. ALIMENTOS ─────────────────────────────────────────────────────────
  {
    name:        'Gourmet Market [PRUEBA]',
    slug:        'gourmet-market-prueba',
    categoria:   'alimentos',
    description: 'Productos gourmet, artesanales y orgánicos de Colombia. Tienda de prueba.',
    logo_url:    img('gourmet-logo', 200, 200),
    owner:       2,
    productos: [
      { title: 'Café Especial 250 g',            sku: 'GM-CAF-001', price:    42_000,               stock: 100, desc: 'Café altura 1800 msnm, tueste medio, origen Huila, bolsa válvula.',   seeds: ['coffee-beans','coffee-cup'] },
      { title: 'Chocolate Artesanal 70 %',       sku: 'GM-CHO-001', price:    28_000,               stock: 80,  desc: 'Cacao fino de aroma, 70 % cacao, sin azúcar añadida, 100 g.',        seeds: ['chocolate-dark','cacao-bar'] },
      { title: 'Miel Pura de Abejas 500 g',      sku: 'GM-MIE-001', price:    35_000, compare: 48_000, stock: 60, desc: 'Miel cruda sin pasteurizar, colmenas colombianas, frasco vidrio.', seeds: ['honey-jar','bees-honey'] },
      { title: 'Aceite de Oliva Extra Virgen',   sku: 'GM-ACE-001', price:    62_000,               stock: 45,  desc: 'AOVE cold-press, acidez < 0.3 %, botella vidrio 500 ml, importado.',  seeds: ['olive-oil','oil-bottle'] },
      { title: 'Granola Artesanal 400 g',        sku: 'GM-GRA-001', price:    32_000,               stock: 70,  desc: 'Avena, miel, frutos secos y semillas, sin conservantes, bolsa kraft.',seeds: ['granola-bowl','granola-bag'] },
      { title: 'Mermelada Frutos Rojos 300 g',   sku: 'GM-MER-001', price:    24_000,               stock: 90,  desc: 'Fresa, frambuesa y mora colombiana, azúcar de caña, frasco vidrio.',  seeds: ['jam-red','jam-jar'] },
      { title: 'Pasta Artesanal 500 g',          sku: 'GM-PAS-001', price:    22_000,               stock: 120, desc: 'Sémola de trigo duro, seca lentamente, 3 formas: tallarín, penne, rigatoni.', seeds: ['pasta-dry','pasta-pack'] },
      { title: 'Té Verde Matcha Ceremonial',     sku: 'GM-MAT-001', price:    55_000, compare: 72_000, stock: 40, desc: 'Matcha grado ceremonial, origen Japón, lata hermética 80 g.',      seeds: ['matcha-powder','matcha-tea'] },
      { title: 'Frutos Secos Mix 500 g',         sku: 'GM-FRU-001', price:    48_000,               stock: 55,  desc: 'Almendras, nueces, marañón, arándano y uva pasa, bolsa resellable.',  seeds: ['nuts-mix','dried-fruits'] },
      { title: 'Salsa Picante Artesanal 200 ml', sku: 'GM-SAL-001', price:    18_000,               stock: 150, desc: 'Ají habanero colombiano, vinagre de manzana, sin conservantes.',       seeds: ['hot-sauce','chili-bottle'] },
    ],
  },

  // ── 6. BELLEZA ───────────────────────────────────────────────────────────
  {
    name:        'Belleza Natural [PRUEBA]',
    slug:        'belleza-natural-prueba',
    categoria:   'belleza',
    description: 'Cosméticos y skincare naturales, libres de crueldad. Tienda de prueba.',
    logo_url:    img('beauty-logo', 200, 200),
    owner:       2,
    productos: [
      { title: 'Sérum Vitamina C 30 ml',         sku: 'BN-SER-001', price:   125_000, compare: 165_000, stock: 40, desc: 'Vitamina C estabilizada 15 %, ácido hialurónico, pipeta dosificadora.', seeds: ['serum-bottle','skincare-serum'] },
      { title: 'Crema Hidratante FPS 50',         sku: 'BN-CRE-001', price:    98_000,               stock: 55, desc: 'Base mineral, UVA+UVB, fórmula ligera no comedogénica, 50 ml.',         seeds: ['face-cream','sunscreen-tube'] },
      { title: 'Aceite de Argán 60 ml',           sku: 'BN-ACE-001', price:    85_000, compare: 115_000, stock: 35, desc: '100 % puro, prensado en frío, para cabello, piel y uñas, gotero.',  seeds: ['argan-oil','oil-beauty'] },
      { title: 'Mascarilla de Arcilla 200 g',     sku: 'BN-MAS-001', price:    62_000,               stock: 50, desc: 'Arcilla caolín + bentonita, desintoxicante, para todo tipo de piel.',  seeds: ['clay-mask','face-mask'] },
      { title: 'Labial Mate 24 h',                sku: 'BN-LAB-001', price:    45_000,               stock: 70, desc: 'Fórmula cremosa larga duración, 16 tonos, sin parabenos ni talco.',    seeds: ['lipstick-red','lipstick-set'] },
      { title: 'Perfume Oriental 50 ml EDP',      sku: 'BN-PER-001', price:   195_000, compare: 260_000, stock: 25, desc: 'Notas oud, vainilla y sándalo, frasco cristal, duración 8-10 h.', seeds: ['perfume-bottle','fragrance-luxury'] },
      { title: 'Shampoo Sin Sulfatos 400 ml',     sku: 'BN-SHA-001', price:    68_000,               stock: 60, desc: 'Fórmula suave, keratina vegetal, para cabellos teñidos y delicados.',  seeds: ['shampoo-bottle','hair-product'] },
      { title: 'Kit Brochas Maquillaje x8',       sku: 'BN-KIT-001', price:    89_000, compare: 120_000, stock: 30, desc: '8 brochas sintéticas veganas, pelo alta densidad, estuche zip.', seeds: ['makeup-brushes','brush-set'] },
      { title: 'Protector Solar Mineral SPF 30',  sku: 'BN-SOL-001', price:    72_000,               stock: 45, desc: 'Óxido de zinc no nano, resistente al agua, finish natural seco.',      seeds: ['sunscreen-mineral','sun-protection'] },
      { title: 'Tónico Facial Rosas 200 ml',      sku: 'BN-TON-001', price:    55_000,               stock: 65, desc: 'Agua de rosas pura, aloe vera, equilibrante pH, spray difusor.',       seeds: ['toner-rose','rose-water'] },
    ],
  },

  // ── 7. NIÑOS ─────────────────────────────────────────────────────────────
  {
    name:        'Mundo Kids [PRUEBA]',
    slug:        'mundo-kids-prueba',
    categoria:   'ninos',
    description: 'Juguetes educativos y artículos infantiles seguros y divertidos. Tienda de prueba.',
    logo_url:    img('kids-logo', 200, 200),
    owner:       2,
    productos: [
      { title: 'Set LEGO Clásico 1500 piezas',   sku: 'MK-LEG-001', price:   285_000, compare: 380_000, stock: 15, desc: 'Bloques creativos, certificación CE, sin BPA, para 6-12 años.',     seeds: ['lego-bricks','lego-build'] },
      { title: 'Bicicleta Infantil 16"',          sku: 'MK-BIC-001', price:   450_000, compare: 590_000, stock: 8,  desc: 'Aluminio ligero, rueditas estabilizadoras, freno trasero, 4-7 años.',seeds: ['kids-bike','bicycle-child'] },
      { title: 'Muñeca Interactiva Bebé',         sku: 'MK-MUN-001', price:   165_000,               stock: 20, desc: 'Llora, ríe y dice palabras, accesorios incluidos, segura 3+ años.',   seeds: ['baby-doll','doll-toy'] },
      { title: 'Juego de Ajedrez Didáctico',      sku: 'MK-AJE-001', price:    85_000,               stock: 30, desc: 'Madera MDF, piezas grandes, manual de estrategia, 8+ años.',          seeds: ['chess-board','chess-pieces'] },
      { title: 'Pinturas Acuarela 36 Colores',    sku: 'MK-PIN-001', price:    55_000,               stock: 50, desc: 'Pigmentos seguros AP, incluye 5 pinceles y paleta, sin tóxicos.',     seeds: ['watercolor-set','art-kids'] },
      { title: 'Scooter Plegable 3 Ruedas',       sku: 'MK-SCO-001', price:   210_000, compare: 275_000, stock: 12, desc: 'Aluminio, freno trasero, luces LED en ruedas, talla ajustable.',  seeds: ['scooter-kids','scooter-play'] },
      { title: 'Rompecabezas 500 Piezas',         sku: 'MK-ROM-001', price:    65_000,               stock: 35, desc: 'Cartón grueso premium, diseños colombianos, para 7+ años.',           seeds: ['puzzle-pieces','jigsaw-puzzle'] },
      { title: 'Kit de Ciencias 30 Experimentos', sku: 'MK-CIE-001', price:   125_000,               stock: 22, desc: '30 experimentos, materiales seguros, guía ilustrada, 8-14 años.',    seeds: ['science-kit','experiment-kids'] },
      { title: 'Peluche Gigante Oso 80 cm',       sku: 'MK-PEL-001', price:   175_000, compare: 230_000, stock: 18, desc: 'Peluche suave hipoalergénico, lavable a máquina, 0+ meses.',     seeds: ['teddy-bear','plush-toy'] },
      { title: 'Guitarra Acústica Infantil 1/2',  sku: 'MK-GUI-001', price:    98_000,               stock: 25, desc: 'Madera abeto, 6 cuerdas nylon, tamaño mitad, con funda, 5+ años.',   seeds: ['kids-guitar','guitar-child'] },
    ],
  },

  // ── 8. ARTESANÍAS ────────────────────────────────────────────────────────
  {
    name:        'Artesanos CO [PRUEBA]',
    slug:        'artesanos-co-prueba',
    categoria:   'artesanias',
    description: 'Artesanías colombianas auténticas hechas por artesanos locales. Tienda de prueba.',
    logo_url:    img('craft-logo', 200, 200),
    owner:       2,
    productos: [
      { title: 'Mochila Wayuu Auténtica',         sku: 'AC-MOC-001', price:   320_000, compare: 420_000, stock: 15, desc: 'Tejida a mano por artesanas Wayuu, algodón 100 %, diseño geométrico.',seeds: ['wayuu-bag','mochila-colors'] },
      { title: 'Figura Totumo Pintada',           sku: 'AC-TOT-001', price:    85_000,               stock: 25, desc: 'Totumo natural laqueado, pintado a mano, motivos indígenas, 20 cm.',  seeds: ['craft-gourd','totumo-art'] },
      { title: 'Sombrero Vueltiao Fino',          sku: 'AC-SOM-001', price:   450_000, compare: 590_000, stock: 8,  desc: 'Palma de caña flecha, tejido 21 vueltas, talla única ajustable.',  seeds: ['vueltiao-hat','colombian-hat'] },
      { title: 'Pulseras Choibá Set x5',          sku: 'AC-PUL-001', price:    48_000,               stock: 60, desc: 'Semilla choibá natural, hilo encerado, colores vibrantes, ajustables.', seeds: ['bracelets-craft','seed-jewelry'] },
      { title: 'Cesta de Fique Tejida',           sku: 'AC-CES-001', price:   125_000,               stock: 20, desc: 'Fique teñido con tintes naturales, tejida en Antioquia, Ø 35 cm.',    seeds: ['woven-basket','fique-craft'] },
      { title: 'Plato Cerámica Ráquira',          sku: 'AC-CER-001', price:    95_000, compare: 130_000, stock: 18, desc: 'Arcilla Ráquira vidriada, pintada a mano, apta alimentos, Ø 28 cm.',seeds: ['raquira-ceramic','pottery-plate'] },
      { title: 'Hamaca Artesanal 2 Plazas',       sku: 'AC-HAM-001', price:   285_000,               stock: 10, desc: 'Algodón trenzado, 200×150 cm, travesaños madera, soporta 200 kg.',    seeds: ['hammock-colored','hammock-relax'] },
      { title: 'Cofre Madera Tallada',            sku: 'AC-COF-001', price:   165_000, compare: 215_000, stock: 12, desc: 'Cedro colombiano tallado a mano, cierre latón, interior forrado.',  seeds: ['wooden-box','carved-wood'] },
      { title: 'Collar de Tagua Multicolor',      sku: 'AC-COL-001', price:    72_000,               stock: 35, desc: 'Semilla tagua (marfil vegetal) torneada y pintada, longitud 60 cm.',  seeds: ['tagua-necklace','eco-jewelry'] },
      { title: 'Tapete Chiqui Rectangular',       sku: 'AC-TAP-001', price:   198_000,               stock: 14, desc: 'Algodón reciclado tejido en telar, 80×120 cm, lavable, varios diseños.',seeds: ['woven-rug','handmade-carpet'] },
    ],
  },

  // ── 9. TECNOLOGÍA (segunda tienda) ───────────────────────────────────────
  {
    name:        'Gadget Hub [PRUEBA]',
    slug:        'gadget-hub-prueba',
    categoria:   'tecnologia',
    description: 'Periféricos y accesorios tech de última generación. Tienda de prueba.',
    logo_url:    img('gadget-logo', 200, 200),
    owner:       2,
    productos: [
      { title: 'SSD Externo 1 TB USB-C',          sku: 'GH-SSD-001', price:   395_000, compare: 520_000, stock: 20, desc: 'Velocidad 1050 MB/s lectura, resistente golpes, compacto 50 g.',     seeds: ['ssd-drive','storage-device'] },
      { title: 'Hub USB-C 10 en 1',               sku: 'GH-HUB-001', price:   185_000,               stock: 30, desc: 'HDMI 4K, 3×USB-A, USB-C PD 100 W, SD/microSD, Ethernet, audio.',    seeds: ['usb-hub','computer-accessories'] },
      { title: 'Webcam Full HD 1080p',             sku: 'GH-WEB-001', price:   225_000, compare: 295_000, stock: 18, desc: 'Autofoco, micrófono estéreo, clip universal, plug & play.',         seeds: ['webcam-desk','camera-laptop'] },
      { title: 'Cargador GaN 65 W 3 puertos',     sku: 'GH-CHG-001', price:   145_000,               stock: 40, desc: '2×USB-C + 1×USB-A, carga simultánea, tecnología GaN, compacto.',     seeds: ['charger-compact','gan-charger'] },
      { title: 'Cable Braided USB-C 2 m',          sku: 'GH-CAB-001', price:    32_000,               stock: 80, desc: 'Nylon trenzado 240 W, 40 Gbps, compatible Thunderbolt 4.',            seeds: ['usb-cable','cable-braided'] },
      { title: 'Mousepad XL RGB 90×40 cm',         sku: 'GH-MPA-001', price:    89_000,               stock: 35, desc: 'Microfibra suave, base antideslizante, iluminación RGB 14 modos.',    seeds: ['mousepad-rgb','desk-setup'] },
      { title: 'Soporte Monitor Articulado',       sku: 'GH-SOP-001', price:   265_000, compare: 340_000, stock: 12, desc: 'Brazo articulado doble, soporta hasta 9 kg, gestión de cables.',   seeds: ['monitor-arm','desk-monitor'] },
      { title: 'Micrófono USB Condensador',        sku: 'GH-MIC-001', price:   320_000,               stock: 15, desc: 'Cardioide, 24bit/192 kHz, filtro antipop, soporte articulado incluido.', seeds: ['microphone-desk','recording-mic'] },
      { title: 'Power Bank 20000 mAh 65 W',        sku: 'GH-PWR-001', price:   185_000, compare: 245_000, stock: 25, desc: '3 puertos USB, carga bidireccional 65 W, pantalla LED, 450 g.',   seeds: ['powerbank-large','battery-pack'] },
      { title: 'Kit Limpieza Pantallas Pro',       sku: 'GH-LMP-001', price:    28_000,               stock: 100, desc: 'Spray 100 ml sin alcohol + 4 paños microfibra, safe para OLED.',   seeds: ['screen-cleaner','cleaning-kit'] },
    ],
  },

  // ── 10. MODA (segunda tienda) ────────────────────────────────────────────
  {
    name:        'Eco Moda [PRUEBA]',
    slug:        'eco-moda-prueba',
    categoria:   'moda',
    description: 'Moda sostenible con fibras naturales y procesos responsables. Tienda de prueba.',
    logo_url:    img('ecomoda-logo', 200, 200),
    owner:       2,
    productos: [
      { title: 'Camiseta Algodón Orgánico',       sku: 'EM-CAM-001', price:    95_000, compare: 125_000, stock: 45, desc: 'Algodón GOTS certificado, tintura natural, fit regular, XS-XXL.',    seeds: ['organic-tshirt','eco-clothing'] },
      { title: 'Pantalón Lino Premium',           sku: 'EM-PAN-001', price:   235_000,               stock: 25, desc: '100 % lino europeo, corte palazzo, cintura elástica, S-XL.',           seeds: ['linen-pants','natural-fabric'] },
      { title: 'Blusa Tencel Fluida',             sku: 'EM-BLU-001', price:   165_000, compare: 215_000, stock: 30, desc: 'Fibra Lyocell de eucalipto, textura sedosa, manga larga globo.',    seeds: ['silk-blouse','flowy-top'] },
      { title: 'Zapatillas Canvas Eco',           sku: 'EM-ZAP-001', price:   195_000,               stock: 35, desc: 'Lona algodón reciclado, suela goma natural, plantilla corcho, 35-44.', seeds: ['canvas-shoes','eco-sneakers'] },
      { title: 'Tote Bag Yute Natural',           sku: 'EM-TOT-001', price:    75_000,               stock: 60, desc: 'Yute natural resistente, asa larga cuero vegano, capacidad 18 L.',    seeds: ['jute-bag','natural-tote'] },
      { title: 'Vestido Wrap de Bambú',           sku: 'EM-VES-001', price:   215_000, compare: 280_000, stock: 20, desc: 'Jersey de bambú orgánico, wrap cruzado, largo midi, XS-XL.',       seeds: ['wrap-dress','bamboo-dress'] },
      { title: 'Medias Tie-Dye Set x3',           sku: 'EM-MED-001', price:    55_000,               stock: 50, desc: 'Algodón orgánico teñido a mano, 3 pares, talla única 36-42.',          seeds: ['tiedye-socks','colorful-socks'] },
      { title: 'Gorro Lana Merina',               sku: 'EM-GOR-001', price:    85_000,               stock: 40, desc: 'Lana merina extrafina 100 %, tejido a mano, talla única.',             seeds: ['wool-beanie','winter-hat'] },
      { title: 'Cinturón Cuero Vegano',           sku: 'EM-CIN-001', price:    78_000,               stock: 35, desc: 'Apple leather certificado, hebilla latón reciclado, tallas 70-105.',  seeds: ['vegan-belt','leather-belt'] },
      { title: 'Pañoleta Seda Vegetal 90×90',     sku: 'EM-PAN-002', price:   145_000, compare: 190_000, stock: 20, desc: 'Seda de soja OEKO-TEX, impresión digital botánica, múltiple uso.', seeds: ['silk-scarf','floral-scarf'] },
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
    const slugs = TIENDAS.map(t => t.slug);
    const { rows: stores } = await pool.query(
      `SELECT id FROM stores WHERE slug = ANY($1)`, [slugs]
    );
    const storeIds = stores.map(s => s.id);

    if (storeIds.length) {
      const result = await db.collection('products').deleteMany({ store_id: { $in: storeIds } });
      console.log(`   Productos eliminados: ${result.deletedCount}`);
      await pool.query(`DELETE FROM stores WHERE id = ANY($1)`, [storeIds]);
      console.log(`   Tiendas eliminadas: ${storeIds.length}`);
    }

    await pool.query(
      `DELETE FROM users WHERE email IN ('owner.prueba@shopper.co','owner2.prueba@shopper.co')`
    );
    console.log('   Usuarios de prueba eliminados');
    console.log('✅ Limpieza completada');
    return;
  }

  console.log('🌱 Iniciando seed — 10 tiendas de prueba...\n');

  // 1. Crear 2 owners de prueba
  const hash1 = await bcrypt.hash('Prueba1234', 10);
  const hash2 = await bcrypt.hash('Prueba5678', 10);

  const owners = {};
  for (const [idx, email, name, hash] of [
    [1, 'owner.prueba@shopper.co',  'Vendedor Alpha', hash1],
    [2, 'owner2.prueba@shopper.co', 'Vendedor Beta',  hash2],
  ]) {
    const { rows: ex } = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (ex[0]) {
      owners[idx] = ex[0].id;
      console.log(`👤 Owner ${idx} ya existe — reutilizando`);
    } else {
      const { rows } = await pool.query(
        `INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,'owner') RETURNING id`,
        [name, email, hash]
      );
      owners[idx] = rows[0].id;
      console.log(`👤 Owner ${idx} creado — ${email}`);
    }
  }
  console.log(`   Owner 1 → owner.prueba@shopper.co   / Prueba1234`);
  console.log(`   Owner 2 → owner2.prueba@shopper.co  / Prueba5678\n`);

  // 2. Crear tiendas y productos
  for (const tienda of TIENDAS) {
    const ownerId = owners[tienda.owner];

    const { rows: ex } = await pool.query(
      `SELECT id FROM stores WHERE slug = $1`, [tienda.slug]
    );
    let storeId;

    if (ex[0]) {
      storeId = ex[0].id;
      console.log(`🏪 Tienda ya existe: "${tienda.name}"`);
    } else {
      const { rows } = await pool.query(
        `INSERT INTO stores (owner_id, name, slug, description, logo_url, is_published)
         VALUES ($1,$2,$3,$4,$5,true) RETURNING id`,
        [ownerId, tienda.name, tienda.slug, tienda.description, tienda.logo_url]
      );
      storeId = rows[0].id;
      console.log(`🏪 Tienda creada: "${tienda.name}"`);
    }

    const existentes = await db.collection('products').countDocuments({ store_id: storeId });
    if (existentes > 0) {
      console.log(`   ⚠️  Ya tiene ${existentes} productos — omitiendo`);
    } else {
      const now  = new Date();
      const docs = tienda.productos.map(p => ({
        store_id:      storeId,
        title:         p.title,
        sku:           p.sku,
        category:      tienda.categoria,
        price:         p.price,
        ...(p.compare && { compare_at_price: p.compare }),
        stock:         p.stock,
        description:   p.desc,
        images:        p.seeds.map(s => `https://picsum.photos/seed/${s}/600/600`),
        variants:      [],
        attributes:    {},
        is_active:     true,
        created_at:    now,
        updated_at:    now,
      }));
      await db.collection('products').insertMany(docs);
      console.log(`   ✅ ${docs.length} productos insertados`);
    }
    console.log(`   🔗 /store/${tienda.slug}\n`);
  }

  // 3. Resumen final
  const totalProd = TIENDAS.reduce((s, t) => s + t.productos.length, 0);
  console.log('═'.repeat(58));
  console.log(`✅ Seed completado — ${TIENDAS.length} tiendas · ${totalProd} productos\n`);
  console.log('CREDENCIALES:');
  console.log('  owner.prueba@shopper.co   →  Prueba1234');
  console.log('  owner2.prueba@shopper.co  →  Prueba5678\n');
  console.log('TIENDAS DISPONIBLES:');
  TIENDAS.forEach(t => {
    console.log(`  [${t.categoria.padEnd(12)}]  /store/${t.slug}`);
  });
  console.log('═'.repeat(58));
}

seed()
  .catch(err => { console.error('❌ Error:', err.message); process.exit(1); })
  .finally(async () => { await pool.end(); await mongoClient.close(); });
