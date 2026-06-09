'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, MotionConfig, useScroll, useTransform, useSpring } from 'framer-motion';
import {
  ShieldCheck, ArrowRight, ArrowUpRight, Plus, Check, Heart, Package, Sparkles, Quote,
} from 'lucide-react';
import Link from 'next/link';
import { Store as TipoTienda } from '@/types';
import { useCartStore } from '@/store/cart.store';
import ScrollProgress from '@/components/animated/ScrollProgress';
import AnimatedNumber from '@/components/animated/AnimatedNumber';
import Testimonios from '@/components/animated/EditorialTestimonials';
import CategoryAccordion from '@/components/animated/CategoryAccordion';
import TimelineContent from '@/components/animated/TimelineContent';
import StoresCarousel from '@/components/animated/StoresCarousel';
import { getProductImage, getProductImageByTitle, getLocalImageByTitle } from '@/data/productImages';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export type ProductoDestacado = {
  _id:               string;
  store_id:          string;
  title:             string;
  description?:      string;
  price:             number;
  compare_at_price?: number;
  stock:             number;
  images:            string[];
  sku:               string;
  nombreTienda:      string;
  slugTienda:        string;
  idTienda:          string;
  storeLogo?:        string;
  storeDescription?: string;
  category?:         string;
};

/* ── índice editorial de categorías ── */
const CATEGORIAS = [
  { name: 'Moda',        it: 'y Ropa',     slug: 'moda',        count: 482, blurb: 'Diseño independiente', img: 'photo-1483985988355-763728e1935b' },
  { name: 'Hogar',       it: 'y Deco',     slug: 'hogar',       count: 311, blurb: 'Para tu espacio',       img: 'photo-1555041469-a586c61ea9bc' },
  { name: 'Tecnología',  it: '',           slug: 'tecnologia',  count: 268, blurb: 'Lo último en gadgets',  img: 'photo-1518770660439-4636190af475' },
  { name: 'Artesanías',  it: '',           slug: 'artesanias',  count: 197, blurb: 'Hecho a mano',          img: 'photo-1528150177508-7cc0c36cda5c' },
  { name: 'Alimentos',   it: '',           slug: 'alimentos',   count: 154, blurb: 'Sabor de origen',       img: 'photo-1542838132-92c53300491e' },
  { name: 'Deportes',    it: '',           slug: 'deportes',    count: 142, blurb: 'Para moverte',          img: 'photo-1571902943202-507ec2618e8f' },
  { name: 'Belleza',     it: '',           slug: 'belleza',     count: 209, blurb: 'Cuidado natural',       img: 'photo-1596462502278-27bfdc403348' },
  { name: 'Niños',       it: '',           slug: 'ninos',       count: 118, blurb: 'Para los peques',       img: 'photo-1503944583220-79d8926ad5e2' },
];

const UNSPLASH = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`;

/* ── reveal-on-scroll (respeta prefers-reduced-motion vía MotionConfig) ── */
function Reveal({ children, className, style, delay = 0 }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties; delay?: number;
}) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.65, ease: [0.22, 0.61, 0.36, 1], delay }}>
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TARJETA DE PRODUCTO (mantiene .pcard del design system)
═══════════════════════════════════════════════════════════════════ */
function TarjetaProducto({ p }: { p: ProductoDestacado }) {
  const { addItem, openCart } = useCartStore();
  const [added, setAdded] = useState(false);
  const [fav, setFav] = useState(false);

  const desc = p.compare_at_price && p.compare_at_price > p.price
    ? Math.round((1 - p.price / p.compare_at_price) * 100) : 0;
  const productPage = `/store/${p.slugTienda}/product/${p._id}`;
  // La imagen local mapeada por título tiene prioridad sobre el placeholder del seed
  const productImg  = getLocalImageByTitle(p.title) || p.images?.[0] || getProductImageByTitle(p.title, p.category);

  const agregar = () => {
    addItem({ productId: p._id, storeId: p.idTienda, title: p.title, price: p.price, stock: p.stock, sku: p.sku, image: productImg });
    setAdded(true); setTimeout(() => setAdded(false), 1500); openCart();
  };

  return (
    <article className="pcard">
      <div className="pcard-img">
        <Link href={productPage} className="absolute inset-0 block">
          <img src={productImg} alt={p.title} loading="lazy" />
        </Link>
        {desc > 0 && <span className="pcard-tag tag-sale">−{desc}%</span>}
        <button className={'pcard-fav' + (fav ? ' on' : '')} aria-label={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'} onClick={() => setFav(v => !v)}>
          <Heart className="w-[18px] h-[18px]"
            style={{ fill: fav ? 'var(--primary)' : 'none', color: fav ? 'var(--primary)' : 'var(--ink)' }} />
        </button>
        <button className={'pcard-add' + (added ? ' done' : '')} onClick={agregar} disabled={p.stock === 0} aria-label="Agregar al carrito">
          {added ? <><Check className="w-4 h-4" /> Agregado</> : <><Plus className="w-4 h-4" /> Agregar</>}
        </button>
      </div>
      <div className="pcard-body">
        <span className="pcard-store"><ShieldCheck className="w-3 h-3" /> {p.nombreTienda}</span>
        <h3 className="pcard-name">{p.title}</h3>
        <div className="pcard-price">
          <strong>{fmt(p.price)}</strong>
          {p.compare_at_price ? <s>{fmt(p.compare_at_price)}</s> : null}
        </div>
      </div>
    </article>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   HERO
═══════════════════════════════════════════════════════════════════ */
function Hero({ statsReales, tiendas, productos }: {
  statsReales: { tiendas: number; productos: number; compradores: number; satisfaccion: number } | null;
  tiendas: TipoTienda[];
  productos: ProductoDestacado[];
}) {
  const feat = productos.slice(0, 3);
  const f0 = feat[0];

  const nTiendas   = statsReales?.tiendas    ?? (tiendas.length || 1200);
  const nProductos = statsReales?.productos  ?? 50000;
  const satisf     = statsReales?.satisfaccion ?? 98;

  // —— Parallax suave del stack al hacer scroll (ui-ux-pro-max: subtle, respeta reduced motion vía MotionConfig) ——
  const stackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: stackRef, offset: ['start end', 'end start'] });
  const ySlow = useSpring(useTransform(scrollYProgress, [0, 1], [0,  -80]), { stiffness: 60, damping: 25 });
  const yMid  = useSpring(useTransform(scrollYProgress, [0, 1], [0, -130]), { stiffness: 60, damping: 25 });
  const yFast = useSpring(useTransform(scrollYProgress, [0, 1], [0, -180]), { stiffness: 60, damping: 25 });
  const rotMid = useTransform(scrollYProgress, [0, 1], [3, 7]);

  // Fallbacks por keyword en título → categoría → default. Asegura coherencia visual.
  const polImg = (i: number) => {
    const p = feat[i];
    if (!p) return UNSPLASH('photo-1483985988355-763728e1935b');
    return p.images?.[0] || getProductImageByTitle(p.title, p.category, i);
  };

  return (
    <section className="ed-hero wrap" id="top">
      <div className="ed-hero-grid">
        {/* Columna izquierda — wordmark + lead + CTA + stats */}
        <Reveal>
          <h1 className="ed-wordmark">
            <span className="row">Hecho</span>
            <span className="row indent"><span className="it">en Colombia</span></span>
            <span className="row">para el mundo.</span>
          </h1>

          <p className="ed-lead">
            Cientos de tiendas pequeñas, miles de historias. Lo único, lo bien
            hecho, lo que <em>aún se hace a mano</em> — curado y verificado en un
            solo lugar.
          </p>

          <div className="ed-cta-row">
            <Link href="#productos" className="btn btn-primary">
              Explorar productos <ArrowRight className="arr w-[18px] h-[18px]" />
            </Link>
            <Link href="#categorias" className="btn btn-ghost">Ver categorías</Link>
            <span className="ed-aside"><Sparkles className="w-[14px] h-[14px]" /> Envíos a todo Col.</span>
          </div>

          <div className="ed-stats">
            <div className="ed-stat">
              <div className="ed-stat-n">
                <span className="plus">+</span>
                <AnimatedNumber value={nTiendas} />
              </div>
              <div className="ed-stat-l">Tiendas verificadas</div>
            </div>
            <div className="ed-stat">
              <div className="ed-stat-n">
                <span className="plus">+</span>
                <AnimatedNumber value={nProductos} />
              </div>
              <div className="ed-stat-l">Productos únicos</div>
            </div>
            <div className="ed-stat">
              <div className="ed-stat-n">
                <AnimatedNumber value={satisf} format={false} />
                <span className="plus">%</span>
              </div>
              <div className="ed-stat-l">Satisfacción</div>
            </div>
          </div>
        </Reveal>

        {/* Columna derecha — polaroid stack con parallax */}
        <Reveal delay={0.12}>
          <div className="ed-stack" ref={stackRef}>
            <motion.div className="ed-pol p1" style={{ y: ySlow }}>
              <img src={polImg(0)} alt={feat[0]?.title ?? 'Producto destacado'} />
              <div className="ed-pol-cap">
                <span>{feat[0]?.nombreTienda ?? 'Tienda local'}</span>
                <span className="pr">{f0 ? fmt(f0.price) : ''}</span>
              </div>
            </motion.div>
            <motion.div className="ed-pol p2" style={{ y: yFast, rotate: rotMid }}>
              <img src={polImg(1)} alt={feat[1]?.title ?? 'Producto destacado'} />
              <div className="ed-pol-cap">
                <span>{feat[1]?.nombreTienda ?? 'Taller artesanal'}</span>
                <span className="pr">{feat[1] ? fmt(feat[1].price) : ''}</span>
              </div>
            </motion.div>
            <motion.div className="ed-pol p3" style={{ y: yMid }}>
              <img src={polImg(2)} alt={feat[2]?.title ?? 'Producto destacado'} />
            </motion.div>

            <motion.div
              className="ed-float-quote"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
            >
              Comprar lo nuestro es <br />sostener manos colombianas.
            </motion.div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   BENTO CATEGORÍAS — asimétrico editorial
═══════════════════════════════════════════════════════════════════ */
function BentoCategorias() {
  return (
    <section className="sec wrap" id="categorias">
      <Reveal>
        <div className="ed-sec-head">
          <h2 className="ed-sec-title">Por <span className="it">categoría</span></h2>
          <Link href="/search" className="ed-sec-link">Ver todo el catálogo <ArrowRight className="w-[16px] h-[16px]" /></Link>
        </div>
      </Reveal>

      <Reveal>
        <CategoryAccordion />
      </Reveal>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   GRILLA DE PRODUCTOS — "Lo más buscado" con reveal Timeline
═══════════════════════════════════════════════════════════════════ */
function Grilla({ productos, cargando }: { productos: ProductoDestacado[]; cargando: boolean }) {
  const timelineRef = useRef<HTMLElement>(null);

  return (
    <section className="sec wrap pgrid-section" id="productos" ref={timelineRef}>
      {/* Header — alineación reforzada en 2 columnas (titular grande / link) */}
      <TimelineContent
        as="header"
        animationNum={0}
        timelineRef={timelineRef}
        className="ed-sec-head"
      >
        <h2 className="ed-sec-title">Lo más <span className="it">buscado</span></h2>
        <Link href="/search" className="ed-sec-link">Ver más <ArrowRight className="w-[16px] h-[16px]" /></Link>
      </TimelineContent>

      {/* Filtros — chips alineadas, reveal con stagger */}
      <TimelineContent
        as="nav"
        animationNum={1}
        timelineRef={timelineRef}
        className="filters"
        aria-label="Filtros de categoría"
      >
        <Link href="/search" className="chip on">Todo</Link>
        {CATEGORIAS.map(c => (
          <Link className="chip" href={`/search?category=${c.slug}`} key={c.slug}>{c.name}</Link>
        ))}
      </TimelineContent>

      {/* Grilla — cada card revela con blur+y+opacity escalonado */}
      <div className="pgrid">
        {cargando && !productos.length
          ? Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="pm-skeleton" style={{ aspectRatio: '1 / 1.32', borderRadius: 'var(--r-md)' }} />
            ))
          : productos.map((p, i) => (
              <TimelineContent
                key={p._id}
                animationNum={2 + i}
                timelineRef={timelineRef}
                viewportMargin="-60px"
              >
                <TarjetaProducto p={p} />
              </TimelineContent>
            ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TESTIMONIOS
═══════════════════════════════════════════════════════════════════ */
function SeccionTestimonios() {
  return (
    <section className="sec wrap">
      <Reveal>
        <div className="ed-sec-head">
          <h2 className="ed-sec-title">Lo dicen <span className="it">quienes compran</span></h2>
          <span className="ed-sec-link" style={{ pointerEvents: 'none' }}>
            <Quote className="w-[16px] h-[16px]" /> Reseñas verificadas
          </span>
        </div>
      </Reveal>
      <Reveal>
        <Testimonios />
      </Reveal>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   BANDA VENDEDORES — Inmersivo editorial
═══════════════════════════════════════════════════════════════════ */
function BandaVendedores() {
  const beneficios = [
    { t: 'Comisiones desde 0%',   d: 'Primer mes sin cobro de plataforma.' },
    { t: 'Pagos cada semana',     d: 'Transferencia directa a tu banco.' },
    { t: 'Tienda en 10 minutos',  d: 'Plantillas listas y panel intuitivo.' },
    { t: 'Soporte humano',        d: 'Atendemos en menos de 24h.' },
  ];

  return (
    <section className="sec wrap" id="vender">
      <Reveal>
        <div className="ed-seller">
          <div className="ed-reg tl" aria-hidden /><div className="ed-reg br" aria-hidden />
          <div className="ed-seller-inner">
            <div>
              <div className="ed-seller-eyebrow">
                <span className="pill">PARA VENDEDORES</span>
              </div>
              <h2>
                ¿Tienes una<br />
                tienda? Véndela<br />
                <span className="it">en grande.</span>
              </h2>
              <p>
                Lleva tu marca independiente a miles de clientes en toda Colombia.
                Sin enredos, con todo el respaldo de Shopper.
              </p>
              <div className="ed-seller-cta">
                <Link href="/auth/register" className="ed-btn-ink">
                  Abrir mi tienda <ArrowRight className="w-[18px] h-[18px]" />
                </Link>
                <Link href="/owner" className="ed-btn-ghost-light">
                  Ya tengo cuenta <ArrowUpRight className="w-[16px] h-[16px]" />
                </Link>
              </div>
            </div>

            <div className="ed-seller-list">
              {beneficios.map((b, i) => (
                <div className="ed-seller-item" key={i}>
                  <span className="dot" aria-hidden />
                  <div>
                    <div className="t">{b.t}</div>
                    <div className="d">{b.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
═══════════════════════════════════════════════════════════════════ */
export interface HomeData {
  tiendas:     TipoTienda[];
  destacados:  ProductoDestacado[];
  ofertas:     ProductoDestacado[];
  statsReales: { tiendas: number; productos: number; compradores: number; satisfaccion: number } | null;
}

export default function HomeClient({ tiendas, destacados, statsReales }: HomeData) {
  return (
    <MotionConfig reducedMotion="user">
      <ScrollProgress />
      <div className="min-h-screen">
        {/* 1. Identidad — golpe visual de bienvenida */}
        <Hero tiendas={tiendas} statsReales={statsReales} productos={destacados} />

        {/* 2. Exploración — bento interactivo por categoría */}
        <BentoCategorias />

        {/* 4. Marca — 2 columnas verticales de tiendas con reveal cards */}
        <StoresCarousel tiendas={tiendas} />

        {/* 5. Comercio — productos destacados con reveal cinematográfico */}
        <Grilla productos={destacados} cargando={false} />

        {/* 6. Confianza — testimonios reales */}
        <SeccionTestimonios />

        {/* 7. Cierre — invitación a vender (último CTA) */}
        <BandaVendedores />
      </div>
    </MotionConfig>
  );
}
