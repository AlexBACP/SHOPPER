/**
 * IMÁGENES REALES DE PRODUCTOS (Unsplash — libre uso comercial)
 * Curadas para el contexto colombiano del marketplace Shopper.
 *
 * Estrategia 2026:
 *  1. `getProductImageByTitle(title, category)` — busca primero por keyword en el título
 *     y devuelve la imagen MÁS acorde a lo que vende el producto.
 *  2. Si no hay match por keyword, cae a la imagen de categoría.
 *  3. Fallback global si no hay categoría conocida.
 */

const UNSPLASH = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`;

/* ──────────────────────────────────────────────────────────────────────
   1. MAPEO POR KEYWORD — específico, por lo que VENDE el producto
   Las imágenes LOCALES (/products/*) tienen prioridad sobre Unsplash.
   ────────────────────────────────────────────────────────────────────── */
type Keyword = { match: RegExp; img: string };

const KEYWORD_MAP: Keyword[] = [
  /* ── Locales — TIENDA TECNO BRANDON ─────────────────────────────── */
  { match: /\b(audifono|audífono|earbud|headphone|in[\s-]?ear)/i, img: '/products/tecno/headphones.png' },
  { match: /\b(parlante|altavoz|bocina|speaker)/i,                 img: '/products/tecno/parlante.png' },
  { match: /\b(mouse|raton|ratón)/i,                               img: '/products/tecno/mouse.png' },
  { match: /\b(teclado|keyboard)/i,                                img: '/products/tecno/teclado.png' },
  { match: /\b(cargador|charger)/i,                                img: '/products/tecno/cargador.png' },
  { match: /\b(powerbank|power[\s-]?bank|bater[ií]a\s*port)/i,     img: '/products/tecno/powerbank.png' },
  { match: /\b(reloj|smartwatch|watch\b)/i,                        img: '/products/tecno/reloj.png' },
  { match: /\b(webcam|c[aá]mara\s*web|videoconferencia)/i,         img: '/products/tecno/webcam.png' },

  /* ── Locales — TIENDA MUNDO KIDS ────────────────────────────────── */
  { match: /\b(acuarel|pintura\s*infantil|set\s*pintura)/i,        img: '/products/ninos/acuarela.png' },
  { match: /\b(ajedrez|chess)/i,                                   img: '/products/ninos/ajedrez.png' },
  { match: /\b(bicicleta|triciclo|bici\s*ni[ñn]os?)/i,             img: '/products/ninos/bicicleta.png' },
  { match: /\b(ciencia|experimento|kit\s*ciencia|laborator)/i,     img: '/products/ninos/ciencia-kit.png' },
  { match: /\b(guitarra|guitar)/i,                                 img: '/products/ninos/guitarra.png' },
  { match: /\b(lego|bloques|construccion|construcción)/i,          img: '/products/ninos/lego.png' },
  { match: /\b(mu[ñn]eca|doll)/i,                                  img: '/products/ninos/muneca.png' },
  { match: /\b(peluche|plush|stuffed)/i,                           img: '/products/ninos/peluche.png' },
  { match: /\b(rompecabeza|puzzle|jigsaw)/i,                       img: '/products/ninos/rompecabezas.png' },
  { match: /\b(scooter|patineta|monopatin|monopatín)/i,            img: '/products/ninos/scooter.png' },

  /* ── Unsplash — keywords no cubiertos por imágenes locales ─────── */
  // Tecnología — audio
  { match: /\b(audifono|audífono|earbud|in[\s-]?ear|headphone)/i,            img: UNSPLASH('photo-1505740420928-5e560c06d30e') },
  { match: /\b(parlante|altavoz|bocina|speaker|bluetooth\s*speaker)/i,      img: UNSPLASH('photo-1545454675-3531b543be5d') },
  { match: /\b(microfono|micrófono|microphone|podcast)/i,                   img: UNSPLASH('photo-1590602847861-f357a9332bbc') },

  // Tecnología — cómputo / móvil
  { match: /\b(smartphone|celular|telefono|teléfono|iphone|samsung|movil|móvil)/i, img: UNSPLASH('photo-1511707171634-5f897ff02aa9') },
  { match: /\b(laptop|notebook|ultrabook|portatil|portátil|macbook)/i,      img: UNSPLASH('photo-1593642632559-0c6d3fc62b89') },
  { match: /\b(tablet|ipad)/i,                                               img: UNSPLASH('photo-1561154464-82e9adf32764') },
  { match: /\b(mouse|raton|ratón|rat[oó]n\s*gamer)/i,                       img: UNSPLASH('photo-1527864550417-7fd91fc51a46') },
  { match: /\b(teclado|keyboard|mecanico|mecánico)/i,                       img: UNSPLASH('photo-1587829741301-dc798b83add3') },
  { match: /\b(monitor|pantalla|display\s*\d+|4k|ultrawide)/i,              img: UNSPLASH('photo-1527443224154-c4a3942d3acf') },
  { match: /\b(camara|cámara|mirrorless|reflex|dslr|gopro)/i,               img: UNSPLASH('photo-1625948515291-69613efd103f') },
  { match: /\b(dron|drone)/i,                                                img: UNSPLASH('photo-1473968512647-3e447244af8f') },
  { match: /\b(smartwatch|reloj.*(fit|gps|smart)|fitbit|garmin)/i,          img: UNSPLASH('photo-1572569511254-d8f925fe2cbb') },
  { match: /\b(consola|playstation|xbox|nintendo|switch)/i,                 img: UNSPLASH('photo-1486572788966-cfd3df1f5b42') },
  { match: /\b(cable|cargador|charger|powerbank|power\s*bank|bater[ií]a)/i,img: UNSPLASH('photo-1622445275576-721325763afe') },

  // Moda
  { match: /\b(camiseta|polo|t[\s-]?shirt|playera)/i,                       img: UNSPLASH('photo-1521572163474-6864f9cf17ab') },
  { match: /\b(camisa|blusa|shirt(?!s))/i,                                  img: UNSPLASH('photo-1602810318383-e386cc2a3ccf') },
  { match: /\b(jean|pantalon|pantalón|denim)/i,                             img: UNSPLASH('photo-1542272604-787c3835535d') },
  { match: /\b(vestido|dress)/i,                                            img: UNSPLASH('photo-1539109136881-3be0616acf4b') },
  { match: /\b(chaqueta|jacket|abrigo|coat|cazadora)/i,                     img: UNSPLASH('photo-1551028719-00167b16eac5') },
  { match: /\b(zapato|tenis|sneakers?|deportivas?)/i,                       img: UNSPLASH('photo-1542291026-7eec264c27ff') },
  { match: /\b(bota|botin|botín|boots)/i,                                   img: UNSPLASH('photo-1605812860427-4024433a70fd') },
  { match: /\b(sombrero|gorra|hat|cap)/i,                                   img: UNSPLASH('photo-1521369909029-2afed882baee') },
  { match: /\b(bolso|bolsa|cartera|handbag|backpack|mochila(?!\s*wayuu|\s*tejida))/i, img: UNSPLASH('photo-1548036328-c9fa89d128fa') },
  { match: /\b(gafas|lentes|sunglasses)/i,                                  img: UNSPLASH('photo-1572635196237-14b3f281503f') },

  // Hogar / Deco
  { match: /\b(sofa|sofá|sillón|sillon|couch)/i,                            img: UNSPLASH('photo-1555041469-a586c61ea9bc') },
  { match: /\b(mesa|table)/i,                                                img: UNSPLASH('photo-1592078615290-033ee584e267') },
  { match: /\b(silla|chair)/i,                                              img: UNSPLASH('photo-1503602642458-232111445657') },
  { match: /\b(cama|colchon|colchón|mattress)/i,                            img: UNSPLASH('photo-1505693416388-ac5ce068fe85') },
  { match: /\b(lampara|lámpara|lamp)/i,                                     img: UNSPLASH('photo-1513506003901-1e6a229e2d15') },
  { match: /\b(vela|candle|aromat)/i,                                       img: UNSPLASH('photo-1602874801007-bd458bb1b8b6') },
  { match: /\b(planta|maceta|jardin|jardín)/i,                              img: UNSPLASH('photo-1485955900006-10f4d324d411') },
  { match: /\b(cojin|cojín|almohada|pillow|cushion)/i,                      img: UNSPLASH('photo-1513519245088-0e12902e5a38') },
  { match: /\b(taza|mug|vasos?|copa)/i,                                     img: UNSPLASH('photo-1541167760496-1628856ab772') },
  { match: /\b(jarron|jarrón|florero|vase)/i,                               img: UNSPLASH('photo-1567538096630-e0c55bd6374c') },
  { match: /\b(cuadro|poster|arte|pintura)/i,                               img: UNSPLASH('photo-1513519245088-0e12902e5a38') },

  // Artesanías colombianas
  { match: /\b(wayuu|mochila\s*(wayuu|tejida|arhuaca)|arhuaca)/i,           img: UNSPLASH('photo-1606293459339-aa5d34a7b0e1') },
  { match: /\b(sombrero\s*vueltiao|aguadeño|paja\s*toquilla)/i,             img: UNSPLASH('photo-1577083552431-6e5fd01988ec') },
  { match: /\b(ceramica|cerámica|barro|alfarer)/i,                          img: UNSPLASH('photo-1578500494198-246f612d3b3d') },
  { match: /\b(tejido|crochet|bordado|telar)/i,                             img: UNSPLASH('photo-1610701596007-11502861dcfa') },
  { match: /\b(hamaca|chinchorro)/i,                                        img: UNSPLASH('photo-1597212720128-fb56a5ca5da4') },
  { match: /\b(canasta|cesta|fique)/i,                                      img: UNSPLASH('photo-1528459801416-a9e53bbf4e17') },

  // Alimentos
  { match: /\b(cafe|café|grano|tostion|tostión|arábica|arabica)/i,         img: UNSPLASH('photo-1559056199-641a0ac8b55e') },
  { match: /\b(cacao|chocolate|cocoa)/i,                                    img: UNSPLASH('photo-1594631252845-29fc4cc8cde9') },
  { match: /\b(panela|az[uú]car|miel|honey)/i,                              img: UNSPLASH('photo-1587049352846-4a222e784d38') },
  { match: /\b(arepa|maiz|maíz|harina|masa)/i,                              img: UNSPLASH('photo-1610632380989-680fe40816c6') },
  { match: /\b(fruta|jugo|mango|piña|guayaba|maracuya|maracuyá)/i,         img: UNSPLASH('photo-1559181567-c3190ca9959b') },
  { match: /\b(arequipe|dulce|bocadillo)/i,                                 img: UNSPLASH('photo-1587049352846-4a222e784d38') },

  // Deportes
  { match: /\b(bicicleta|bike|mtb|cycling)/i,                               img: UNSPLASH('photo-1530549387789-4c1017266635') },
  { match: /\b(yoga|colchoneta|pilates|mat\b)/i,                            img: UNSPLASH('photo-1517649763962-0c623066013b') },
  { match: /\b(mancuerna|pesas|gym|gimnasio|equipment)/i,                   img: UNSPLASH('photo-1571902943202-507ec2618e8f') },
  { match: /\b(bal[oó]n|pelota|f[uú]tbol|baloncesto)/i,                     img: UNSPLASH('photo-1593079831268-3381b0db4a77') },
  { match: /\b(running|correr|trote|maraton|maratón)/i,                    img: UNSPLASH('photo-1571019613454-1cb2f99b2d8b') },
  { match: /\b(natacion|natación|gafas\s*nado)/i,                          img: UNSPLASH('photo-1530549387789-4c1017266635') },
  { match: /\b(camping|carpa|tienda\s*camp)/i,                              img: UNSPLASH('photo-1504280390367-361c6d9f38f4') },

  // Belleza
  { match: /\b(perfume|fragancia|fragrance|colonia)/i,                      img: UNSPLASH('photo-1592945403244-b3fbafd7f539') },
  { match: /\b(crema|hidrat|moisturiz|skincare|serum|sérum)/i,             img: UNSPLASH('photo-1612817288484-6f916006741a') },
  { match: /\b(jabon|jabón|soap|exfolian)/i,                                img: UNSPLASH('photo-1570194065650-d99fb4bedf0a') },
  { match: /\b(labial|lipstick|gloss|lipgloss)/i,                           img: UNSPLASH('photo-1586495777744-4413f21062fa') },
  { match: /\b(maquillaje|makeup|sombra|paleta\s*sombras)/i,                img: UNSPLASH('photo-1571781926291-c477ebfd024b') },
  { match: /\b(shampoo|champu|champú|acondicionador|cabello)/i,             img: UNSPLASH('photo-1556228720-195a672e8a03') },
  { match: /\b(esmalte|uñas|manicur)/i,                                     img: UNSPLASH('photo-1604654894610-df63bc536371') },

  // Niños
  { match: /\b(juguete|toy|peluche|stuffed)/i,                              img: UNSPLASH('photo-1566576721346-d4a3b4eaeb55') },
  { match: /\b(bloques?|legos?|construc)/i,                                 img: UNSPLASH('photo-1596461404969-9ae70f2830c1') },
  { match: /\b(libro\s*infantil|cuento|storybook)/i,                        img: UNSPLASH('photo-1515488042361-ee00e0ddd4e4') },
  { match: /\b(coche\s*beb[eé]|cuna|caminador|paseador)/i,                  img: UNSPLASH('photo-1522771930-78848d9293e8') },
  { match: /\b(ropa\s*beb[eé]|baby|bebé)/i,                                 img: UNSPLASH('photo-1599391085308-ca2eaae12baf') },
];

/* ──────────────────────────────────────────────────────────────────────
   2. POR CATEGORÍA — fallback cuando no hay match por título
   ────────────────────────────────────────────────────────────────────── */
export const PRODUCT_IMAGES: Record<string, string[]> = {
  moda: [
    UNSPLASH('photo-1523381210434-271e8be1f52b'),
    UNSPLASH('photo-1556905055-8f358a7a47b2'),
    UNSPLASH('photo-1542272604-787c3835535d'),
    UNSPLASH('photo-1551488831-00ddcb6c6bd3'),
    UNSPLASH('photo-1539109136881-3be0616acf4b'),
    UNSPLASH('photo-1483985988355-763728e1935b'),
  ],
  hogar: [
    UNSPLASH('photo-1555041469-a586c61ea9bc'),
    UNSPLASH('photo-1556228720-195a672e8a03'),
    UNSPLASH('photo-1513519245088-0e12902e5a38'),
    UNSPLASH('photo-1567538096630-e0c55bd6374c'),
    UNSPLASH('photo-1493663284031-b7e3aefcae8e'),
    UNSPLASH('photo-1540574163026-643ea20ade25'),
  ],
  tecnologia: [
    UNSPLASH('photo-1505740420928-5e560c06d30e'),
    UNSPLASH('photo-1572569511254-d8f925fe2cbb'),
    UNSPLASH('photo-1545454675-3531b543be5d'),
    UNSPLASH('photo-1593642632559-0c6d3fc62b89'),
    UNSPLASH('photo-1511707171634-5f897ff02aa9'),
    UNSPLASH('photo-1625948515291-69613efd103f'),
  ],
  artesanias: [
    UNSPLASH('photo-1606293459339-aa5d34a7b0e1'),
    UNSPLASH('photo-1578500494198-246f612d3b3d'),
    UNSPLASH('photo-1610701596007-11502861dcfa'),
    UNSPLASH('photo-1577083552431-6e5fd01988ec'),
    UNSPLASH('photo-1528459801416-a9e53bbf4e17'),
    UNSPLASH('photo-1568395216634-72f2c2cb37bc'),
  ],
  alimentos: [
    UNSPLASH('photo-1559056199-641a0ac8b55e'),
    UNSPLASH('photo-1606937295547-bc0f668317cd'),
    UNSPLASH('photo-1587049352846-4a222e784d38'),
    UNSPLASH('photo-1559181567-c3190ca9959b'),
    UNSPLASH('photo-1594631252845-29fc4cc8cde9'),
    UNSPLASH('photo-1610632380989-680fe40816c6'),
  ],
  deportes: [
    UNSPLASH('photo-1542291026-7eec264c27ff'),
    UNSPLASH('photo-1571902943202-507ec2618e8f'),
    UNSPLASH('photo-1517649763962-0c623066013b'),
    UNSPLASH('photo-1530549387789-4c1017266635'),
    UNSPLASH('photo-1593079831268-3381b0db4a77'),
    UNSPLASH('photo-1574680096145-d05b474e2155'),
  ],
  belleza: [
    UNSPLASH('photo-1592945403244-b3fbafd7f539'),
    UNSPLASH('photo-1612817288484-6f916006741a'),
    UNSPLASH('photo-1571781926291-c477ebfd024b'),
    UNSPLASH('photo-1559056961-84a87c1e1d2c'),
    UNSPLASH('photo-1570194065650-d99fb4bedf0a'),
    UNSPLASH('photo-1598440947619-2c35fc9aa908'),
  ],
  ninos: [
    UNSPLASH('photo-1558060370-d644479cb6f7'),
    UNSPLASH('photo-1566576721346-d4a3b4eaeb55'),
    UNSPLASH('photo-1596461404969-9ae70f2830c1'),
    UNSPLASH('photo-1599391085308-ca2eaae12baf'),
    UNSPLASH('photo-1515488042361-ee00e0ddd4e4'),
    UNSPLASH('photo-1502086223501-7ea6ecd79368'),
  ],
};

/** Devuelve una imagen real aleatoria para una categoría dada. */
export function getRandomProductImage(category?: string): string {
  const cat = category && PRODUCT_IMAGES[category] ? category : 'moda';
  const bucket = PRODUCT_IMAGES[cat];
  return bucket[Math.floor(Math.random() * bucket.length)];
}

/** Devuelve una imagen estable (no-random) por categoría + índice */
export function getProductImage(category: string | undefined, index = 0): string {
  const cat = category && PRODUCT_IMAGES[category] ? category : 'moda';
  const bucket = PRODUCT_IMAGES[cat];
  return bucket[index % bucket.length];
}

/**
 * BÚSQUEDA PRIORITARIA POR TÍTULO — el match más acorde a lo que vende
 * el producto, con fallback a categoría y por último al fallback global.
 *
 * Esta es la función que deben usar las páginas (Home, Search, etc.)
 * cuando el producto no tenga imagen propia subida por el vendedor.
 */
export function getProductImageByTitle(title: string, category?: string, index = 0): string {
  if (title) {
    for (const k of KEYWORD_MAP) {
      if (k.match.test(title)) return k.img;
    }
  }
  if (category && PRODUCT_IMAGES[category]) {
    return getProductImage(category, index);
  }
  return FALLBACK_PRODUCT_IMAGE;
}

/** Fallback global cuando no se conoce la categoría */
export const FALLBACK_PRODUCT_IMAGE = UNSPLASH('photo-1483985988355-763728e1935b');

/**
 * Devuelve SÓLO si el título tiene match con una imagen LOCAL (subida en
 * /public/products/). Usar para forzar la imagen real del catálogo de
 * TecnoBrandon o Mundo Kids por encima del placeholder de seed.
 *
 * Retorna `null` si no hay match local.
 */
export function getLocalImageByTitle(title: string): string | null {
  if (!title) return null;
  for (const k of KEYWORD_MAP) {
    if (k.img.startsWith('/products/') && k.match.test(title)) {
      return k.img;
    }
  }
  return null;
}
