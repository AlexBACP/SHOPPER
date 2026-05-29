'use client';

import { useEffect, useState, useRef, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import {
  motion, AnimatePresence, useInView,
  useMotionValue, useSpring, useTransform,
} from 'framer-motion';
import {
  Search, Store, ArrowRight, X,
  ChevronLeft, ChevronRight, Package,
  CheckCircle, ShoppingCart,
  BadgeCheck, Sparkles, Crown,
  TrendingUp, ShieldCheck, Truck, BarChart3,
  Users, ShoppingBag, Eye, Star, Bell, Zap, CreditCard,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { Store as TipoTienda } from '@/types';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

// ── Contador con física de spring (mucho más suave que setInterval) ──
function ContadorSpring({ objetivo, sufijo = '', retardo = 0 }: {
  objetivo: number; sufijo?: string; retardo?: number;
}) {
  const count   = useMotionValue(0);
  const spring  = useSpring(count, { stiffness: 40, damping: 20, restDelta: 0.5 });
  const display = useTransform(spring, v =>
    `${Math.round(v).toLocaleString('es-CO')}${sufijo}`,
  );
  const ref    = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => count.set(objetivo), retardo * 1000);
    return () => clearTimeout(t);
  }, [inView, objetivo, count, retardo]);

  return <motion.span ref={ref}>{display}</motion.span>;
}

type ProductoDestacado = {
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
};

/* ═══════════════════════════════════════════════════════════════════
   TICKER
═══════════════════════════════════════════════════════════════════ */
const MENSAJES_TICKER: { icon: LucideIcon; text: string }[] = [
  { icon: Truck,       text: 'Envío gratis en pedidos mayores a $150.000' },
  { icon: ShieldCheck, text: 'Pagos 100% seguros con SSL 256-bit' },
  { icon: BadgeCheck,  text: '+1.200 tiendas verificadas en Colombia' },
  { icon: CreditCard,  text: 'Acepta PSE · Nequi · Daviplata · Tarjetas' },
  { icon: Star,        text: 'Satisfacción garantizada o te devolvemos tu dinero' },
];
function TickerAnuncios() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  const doble = [...MENSAJES_TICKER, ...MENSAJES_TICKER];
  return (
    <div className="relative h-9 bg-[var(--nav-bg)] overflow-hidden flex items-center">
      <motion.div className="flex items-center gap-0 whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 28, ease: 'linear', repeat: Infinity }}>
        {doble.map((m, i) => {
          const Icon = m.icon;
          return (
            <span key={i} className="inline-flex items-center gap-1.5 text-xs text-white/80 px-10 shrink-0">
              <Icon className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" /> {m.text}
            </span>
          );
        })}
      </motion.div>
      <button onClick={() => setVisible(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-white/50 hover:text-white transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   HERO SLIDER
═══════════════════════════════════════════════════════════════════ */
const SLIDES = [
  { id: 0, bg: 'from-slate-800 to-slate-900', badge: 'Nuevo en Shopper', badgeColor: 'bg-orange-500',
    title: 'Descubre miles de\nproductos únicos', subtitle: 'Las mejores tiendas independientes de Colombia en un solo lugar.',
    cta: 'Explorar ahora', ctaLink: '#tiendas', accent: '#FF9900',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
    fallback: 'https://picsum.photos/seed/shopper-hero-shopping/900/700', alt: 'Compras de moda' },
  { id: 1, bg: 'from-teal-800 to-teal-900', badge: 'Pago seguro', badgeColor: 'bg-yellow-400',
    title: 'Compra con total\nconfianza', subtitle: 'PSE, Nequi, Daviplata y tarjetas. Todo protegido con SSL 256-bit.',
    cta: 'Cómo funciona', ctaLink: '#como-funciona', accent: '#FFD814',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80',
    fallback: 'https://picsum.photos/seed/shopper-hero-pay/900/700', alt: 'Pago seguro con tarjeta' },
  { id: 2, bg: 'from-orange-700 to-red-800', badge: '¿Eres vendedor?', badgeColor: 'bg-white',
    title: 'Abre tu tienda\ngratis hoy', subtitle: 'Sin comisiones iniciales. Llega a miles de compradores en Colombia.',
    cta: 'Comenzar gratis', ctaLink: '/auth/register', accent: '#FFD814',
    image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=900&q=80',
    fallback: 'https://picsum.photos/seed/shopper-hero-seller/900/700', alt: 'Vendedor gestionando su tienda' },
];
function HeroSlider() {
  const [slide, setSlide] = useState(0);
  const [dir, setDir] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pausado, setPausado] = useState(false);
  const ir = useCallback((idx: number, d: number) => { setDir(d); setSlide(idx); }, []);
  const reiniciar = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => { setDir(1); setSlide(p => (p + 1) % SLIDES.length); }, 5500);
  }, []);
  useEffect(() => { reiniciar(); return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, [reiniciar]);
  const prev = () => { ir((slide - 1 + SLIDES.length) % SLIDES.length, -1); reiniciar(); };
  const next = () => { ir((slide + 1) % SLIDES.length, 1); reiniciar(); };
  const s = SLIDES[slide];
  return (
    <div className="relative w-full overflow-hidden select-none" style={{ height: 'clamp(220px, 35vw, 420px)' }}
      onMouseEnter={() => setPausado(true)} onMouseLeave={() => { setPausado(false); reiniciar(); }}>
      <AnimatePresence custom={dir} mode="popLayout" initial={false}>
        <motion.div key={s.id} custom={dir}
          variants={{
            enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
            center: { x: 0, opacity: 1, transition: { duration: 0.55, ease: [0.32, 0.72, 0, 1] as const } },
            exit:  (d: number) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0, transition: { duration: 0.45 } }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          className={`absolute inset-0 bg-gradient-to-r ${s.bg} flex items-center`}>
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full flex items-center justify-between gap-8">
            <div className="max-w-xl">
              <motion.span initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 text-slate-900 ${s.badgeColor}`}>{s.badge}</motion.span>
              <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
                className="text-white font-bold leading-tight mb-4 whitespace-pre-line" style={{ fontSize: 'clamp(22px, 3.5vw, 48px)' }}>{s.title}</motion.h2>
              <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
                className="text-white/75 text-sm md:text-base mb-6 max-w-sm">{s.subtitle}</motion.p>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}>
                <Link href={s.ctaLink} className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-lg text-slate-900 transition-all hover:scale-105 hover:shadow-lg active:scale-95" style={{ background: s.accent, fontSize: '14px' }}>
                  {s.cta} <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </div>
            <motion.div initial={{ opacity: 0, scale: 0.85, x: 30 }} animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 160, damping: 20 }}
              className="hidden md:block relative shrink-0">
              {/* Halo detrás de la imagen */}
              <div className="absolute -inset-4 rounded-[2rem] blur-2xl opacity-40" style={{ background: s.accent }} />
              <motion.img
                src={s.image}
                alt={s.alt}
                draggable={false}
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = s.fallback; }}
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="relative w-[clamp(210px,26vw,360px)] h-[clamp(160px,20vw,270px)] object-cover rounded-[1.75rem] ring-4 ring-white/15 shadow-2xl shadow-black/50"
              />
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
      <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all hover:scale-110"><ChevronLeft className="w-5 h-5" /></button>
      <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all hover:scale-110"><ChevronRight className="w-5 h-5" /></button>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => { ir(i, i > slide ? 1 : -1); reiniciar(); }}
            className={`rounded-full transition-all duration-300 ${i === slide ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'}`} />
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 z-20">
        {!pausado && <motion.div key={slide} className="h-full bg-white/50" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 5.5, ease: 'linear' }} />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CATEGORÍAS — SVG icons reales, no emojis
═══════════════════════════════════════════════════════════════════ */
const CATEGORIAS = [
  {
    titulo: 'Moda y Ropa', href: '/search?category=moda',
    bg: 'from-pink-500 to-rose-600',
    shadow: 'shadow-pink-200',
    svg: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
        <path d="M12 4L8 10H4l2 16h20l2-16h-4L20 4h-8z" stroke="white" strokeWidth="2" strokeLinejoin="round" fill="rgba(255,255,255,0.15)"/>
        <path d="M12 4c0 2.2 1.8 4 4 4s4-1.8 4-4" stroke="white" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    titulo: 'Hogar y Deco', href: '/search?category=hogar',
    bg: 'from-blue-500 to-indigo-600',
    shadow: 'shadow-blue-200',
    svg: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
        <path d="M4 14L16 4l12 10v14H20v-8h-8v8H4V14z" stroke="white" strokeWidth="2" strokeLinejoin="round" fill="rgba(255,255,255,0.15)"/>
      </svg>
    ),
  },
  {
    titulo: 'Tecnología', href: '/search?category=tecnologia',
    bg: 'from-violet-500 to-purple-700',
    shadow: 'shadow-purple-200',
    svg: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
        <rect x="3" y="6" width="26" height="16" rx="2" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.15)"/>
        <path d="M10 28h12M16 22v6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <path d="M10 14l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    titulo: 'Artesanías', href: '/search?category=artesanias',
    bg: 'from-orange-400 to-amber-600',
    shadow: 'shadow-orange-200',
    svg: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
        <path d="M16 4C10 4 5 9 5 15c0 4 2 7 5 9l2 4h8l2-4c3-2 5-5 5-9 0-6-5-11-11-11z" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.15)"/>
        <path d="M12 15c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4-4-1.8-4-4z" fill="white" opacity="0.6"/>
      </svg>
    ),
  },
  {
    titulo: 'Alimentos', href: '/search?category=alimentos',
    bg: 'from-yellow-400 to-orange-500',
    shadow: 'shadow-yellow-200',
    svg: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
        <path d="M8 6v4c0 3.3 2.7 6 6 6h4c3.3 0 6-2.7 6-6V6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <path d="M16 16v12M6 28h20" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="8" cy="4" r="1.5" fill="white"/><circle cx="16" cy="3" r="1.5" fill="white"/><circle cx="24" cy="4" r="1.5" fill="white"/>
      </svg>
    ),
  },
  {
    titulo: 'Deportes', href: '/search?category=deportes',
    bg: 'from-green-500 to-emerald-600',
    shadow: 'shadow-green-200',
    svg: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
        <circle cx="16" cy="16" r="12" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.15)"/>
        <path d="M10 10c3 1 5 4 6 6M16 16c1 2 4 4 6 5" stroke="white" strokeWidth="1.5"/>
        <path d="M4 16h4M24 16h4M16 4v4M16 24v4" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
      </svg>
    ),
  },
  {
    titulo: 'Belleza', href: '/search?category=belleza',
    bg: 'from-rose-500 to-pink-600',
    shadow: 'shadow-rose-200',
    svg: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
        <path d="M16 4l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" stroke="white" strokeWidth="2" strokeLinejoin="round" fill="rgba(255,255,255,0.25)"/>
        <circle cx="16" cy="24" r="4" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.15)"/>
        <path d="M16 20v-2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    titulo: 'Niños', href: '/search?category=ninos',
    bg: 'from-cyan-400 to-sky-600',
    shadow: 'shadow-cyan-200',
    svg: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
        <circle cx="16" cy="10" r="5" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.15)"/>
        <path d="M8 28v-6a8 8 0 0116 0v6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <path d="M6 20s-2-1-2-3 2-3 2-3M26 20s2-1 2-3-2-3-2-3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

function GridCategorias() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <section ref={ref} className="py-8 px-4 md:px-6 max-w-7xl mx-auto">
      <motion.p initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.4 }}
        className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] text-center mb-5">Explora por categoría</motion.p>
      <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {CATEGORIAS.map((cat, i) => (
          <motion.div key={cat.titulo}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -6, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}>
            <Link href={cat.href}
              className="flex flex-col items-center gap-2.5 p-3 rounded-2xl cursor-pointer text-center group">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.bg} flex items-center justify-center shadow-lg ${cat.shadow} group-hover:shadow-xl transition-all duration-300 group-hover:scale-105`}>
                {cat.svg}
              </div>
              <span className="text-xs font-semibold text-[var(--text-secondary)] leading-tight group-hover:text-[var(--text-primary)] transition-colors">{cat.titulo}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PRODUCTO CARD — 3D tilt + shine sweep + spring reveal
═══════════════════════════════════════════════════════════════════ */
const ProductoCard = memo(function ProductoCard({
  product, index, inView, gradFrom, gradTo,
  isAdded, agregar, openSeller, closeSeller,
}: {
  product:     ProductoDestacado;
  index:       number;
  inView:      boolean;
  gradFrom:    string;
  gradTo:      string;
  isAdded:     boolean;
  agregar:     (p: ProductoDestacado) => void;
  openSeller:  (e: React.MouseEvent<HTMLButtonElement>, p: ProductoDestacado) => void;
  closeSeller: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const rotX  = useMotionValue(0);
  const rotY  = useMotionValue(0);
  const sRotX = useSpring(rotX, { stiffness: 260, damping: 28, mass: 0.5 });
  const sRotY = useSpring(rotY, { stiffness: 260, damping: 28, mass: 0.5 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
    const dy = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
    rotY.set( dx * 4.5);
    rotX.set(-dy * 4.5);
  };
  const onLeave = () => { rotX.set(0); rotY.set(0); };

  const descPct = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : 0;
  const productPage = `/store/${product.slugTienda}/product/${product._id}`;

  return (
    <motion.div
      ref={cardRef}
      data-card="true"
      layout
      initial={{ opacity: 0, y: 28, scale: 0.94 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ delay: Math.min(index * 0.06, 0.45), type: 'spring', stiffness: 200, damping: 24 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileHover={{ y: -6 }}
      style={{ rotateX: sRotX, rotateY: sRotY, transformPerspective: 1200 }}
      className="shrink-0 w-[clamp(220px,65vw,290px)] aspect-[4/5] relative rounded-[28px] overflow-hidden bg-slate-100 cursor-pointer group ring-1 ring-slate-900/[0.06] hover:ring-slate-900/20 transition-all duration-500 hover:shadow-[0_30px_70px_-22px_rgba(15,23,42,0.45)] will-change-transform">

      {/* Imagen full-bleed */}
      <Link href={productPage} className="absolute inset-0 block" draggable={false}>
        {product.images?.[0]
          ? <img
              src={product.images[0]}
              alt={product.title}
              draggable={false}
              className="w-full h-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.08]"
            />
          : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
              <Package className="w-14 h-14 text-slate-400" />
            </div>}

        {/* Shine sweep */}
        <div className="absolute inset-y-0 -inset-x-1/3 -translate-x-full group-hover:translate-x-[250%] transition-transform duration-[1000ms] ease-out bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 pointer-events-none" />

        {/* Agotado overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px] flex items-center justify-center">
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-700 border-2 border-slate-300 px-4 py-2 rounded-full bg-white shadow-md">Agotado</span>
          </div>
        )}
      </Link>

      {/* Top row: descuento + store badge */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none z-10">
        {descPct > 0 && product.stock > 0 ? (
          <motion.span
            initial={{ scale: 0, y: -8 }}
            animate={inView ? { scale: 1, y: 0 } : {}}
            transition={{ delay: Math.min(index * 0.06 + 0.25, 0.6), type: 'spring', stiffness: 360, damping: 16 }}
            className="bg-white text-slate-900 text-[11px] font-black px-2.5 py-1 rounded-full shadow-lg tracking-wider">
            −{descPct}%
          </motion.span>
        ) : product.stock > 0 && product.stock <= 5 ? (
          <motion.span
            initial={{ scale: 0 }}
            animate={inView ? { scale: 1 } : {}}
            transition={{ delay: 0.35, type: 'spring', stiffness: 360, damping: 16 }}
            className="flex items-center gap-1.5 bg-slate-900/85 backdrop-blur text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Solo {product.stock}
          </motion.span>
        ) : <span />}

        <button
          type="button"
          onMouseEnter={(e) => openSeller(e, product)}
          onMouseLeave={closeSeller}
          onClick={e => e.preventDefault()}
          className="pointer-events-auto inline-flex items-center gap-1.5 bg-white/90 hover:bg-white backdrop-blur-md px-2 py-1 rounded-full text-slate-900 transition-all shadow-md hover:shadow-lg max-w-[140px]">
          {product.storeLogo
            ? <img src={product.storeLogo} alt={product.nombreTienda} className="w-4 h-4 rounded-full object-cover shrink-0" />
            : <div className={`w-4 h-4 bg-gradient-to-br ${gradFrom} ${gradTo} rounded-full flex items-center justify-center shrink-0`}>
                <span className="text-[7px] font-black text-white leading-none">{product.nombreTienda[0]?.toUpperCase()}</span>
              </div>}
          <span className="text-[10px] font-bold truncate leading-none">{product.nombreTienda}</span>
        </button>
      </div>

      {/* Info overlay sobre gradiente oscuro */}
      <div className="absolute inset-x-0 bottom-0 p-4 pt-20 bg-gradient-to-t from-black/90 via-black/55 to-transparent pointer-events-none">
        <h3 className="text-white font-bold text-[15px] leading-snug line-clamp-2 mb-2.5 tracking-tight drop-shadow-sm">
          {product.title}
        </h3>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-white text-[20px] font-black leading-none tabular-nums">{fmt(product.price)}</p>
            {descPct > 0 ? (
              <p className="text-white/55 text-[11px] line-through leading-none mt-1 tabular-nums">{fmt(product.compare_at_price!)}</p>
            ) : (
              <p className="text-emerald-300 text-[10px] font-bold flex items-center gap-1 leading-none mt-1.5">
                <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5"><path d="M6 1l1.2 2.4L10 4l-2 2 .5 2.8L6 7.5l-2.5 1.3L4 6 2 4l2.8-.6L6 1z" fill="currentColor"/></svg>
                Envío gratis
              </p>
            )}
          </div>

          {/* Botón circular "+" */}
          <motion.button
            onClick={() => agregar(product)}
            disabled={product.stock === 0}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            aria-label="Agregar al carrito"
            title="Agregar al carrito"
            className={`pointer-events-auto shrink-0 w-11 h-11 rounded-full flex items-center justify-center shadow-xl transition-all duration-200 ${
              isAdded
                ? 'bg-emerald-500 text-white scale-110'
                : 'bg-white text-slate-900 hover:bg-orange-400 hover:text-white hover:rotate-[8deg] hover:scale-110 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed'
            }`}>
            {isAdded ? (
              <motion.span
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 18 }}>
                <CheckCircle className="w-5 h-5" strokeWidth={2.4} />
              </motion.span>
            ) : (
              <ShoppingCart className="w-[18px] h-[18px]" strokeWidth={2.2} />
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
});

/* ═══════════════════════════════════════════════════════════════════
   CARRUSEL DE PRODUCTOS
═══════════════════════════════════════════════════════════════════ */
function CarruselProductos({
  productos, cargando,
  titulo    = 'Productos destacados',
  subtitulo = 'Los más populares de nuestras tiendas',
  badge,
  gradFrom  = 'from-orange-500',
  gradTo    = 'to-red-500',
  shadowC   = 'shadow-orange-200',
  urgente   = false,
  autoPlay  = false,
}: {
  productos:  ProductoDestacado[];
  cargando?:  boolean;
  titulo?:    string;
  subtitulo?: string;
  badge?:     string;
  gradFrom?:  string;
  gradTo?:    string;
  shadowC?:   string;
  urgente?:   boolean;
  autoPlay?:  boolean;
}) {
  const { addItem, openCart } = useCartStore();
  const [agregadoId, setAgregadoId] = useState<string | null>(null);

  // ── Countdown (urgente) ──────────────────────────────────────────
  const [ctdown, setCtdown] = useState({ h: 23, m: 59, s: 59 });
  useEffect(() => {
    if (!urgente) return;
    const calc = () => {
      const now  = new Date();
      const mid  = new Date(); mid.setHours(24, 0, 0, 0);
      const diff = Math.max(0, Math.floor((mid.getTime() - now.getTime()) / 1000));
      setCtdown({ h: Math.floor(diff / 3600), m: Math.floor((diff % 3600) / 60), s: diff % 60 });
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [urgente]);

  // ── Portal popup del vendedor ────────────────────────────────────────────
  type SellerPopup = { rect: DOMRect; product: ProductoDestacado; above: boolean };
  const [sellerPopup, setSellerPopup] = useState<SellerPopup | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const openSeller = useCallback((e: React.MouseEvent<HTMLButtonElement>, product: ProductoDestacado) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    const cardEl = (e.currentTarget as HTMLElement).closest('[data-card]');
    const rect   = (cardEl ?? e.currentTarget).getBoundingClientRect();
    setSellerPopup({ rect, product, above: rect.top > 220 });
  }, []);
  const closeSeller = useCallback(() => {
    hideTimer.current = setTimeout(() => setSellerPopup(null), 130);
  }, []);
  const keepSeller = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);
  // ────────────────────────────────────────────────────────────────────────

  const scrollRef   = useRef<HTMLDivElement>(null);
  const [puedeIzq,  setPuedeIzq]  = useState(false);
  const [puedeDer,  setPuedeDer]  = useState(true);
  const [scrollPct, setScrollPct] = useState(0);
  const [grabbing,  setGrabbing]  = useState(false);
  const [hovering,  setHovering]  = useState(false);

  const isDragging  = useRef(false);
  const armed       = useRef(false);                 // puntero presionado, posible arrastre
  const didDrag     = useRef(false);                 // hubo movimiento → suprimir el clic
  const pointerId   = useRef<number | null>(null);
  const startX      = useRef(0);
  const startScroll = useRef(0);
  const velX        = useRef(0);
  const prevX       = useRef(0);
  const prevT       = useRef(0);
  const rafId       = useRef<number | null>(null);

  const actualizarBotones = useCallback(() => {
    const el = scrollRef.current; if (!el) return;
    setPuedeIzq(el.scrollLeft > 8);
    setPuedeDer(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
    const max = el.scrollWidth - el.clientWidth;
    setScrollPct(max > 0 ? el.scrollLeft / max : 0);
  }, []);
  useEffect(() => {
    const el = scrollRef.current; if (!el) return;
    el.addEventListener('scroll', actualizarBotones, { passive: true });
    // Cierra el popup al hacer scroll horizontal
    el.addEventListener('scroll', () => setSellerPopup(null), { passive: true });
    actualizarBotones();
    return () => el.removeEventListener('scroll', actualizarBotones);
  }, [actualizarBotones, productos]);
  const onPtrDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current; if (!el) return;
    if (rafId.current) cancelAnimationFrame(rafId.current);
    // Armamos un posible arrastre, pero NO capturamos el puntero todavía:
    // así un clic limpio llega al <Link> del producto y navega.
    armed.current       = true;
    isDragging.current  = false;
    didDrag.current     = false;
    pointerId.current   = e.pointerId;
    startX.current      = e.clientX;
    startScroll.current = el.scrollLeft;
    prevX.current       = e.clientX;
    prevT.current       = performance.now();
    velX.current        = 0;
  }, []);

  const onPtrMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!armed.current) return;
    const el = scrollRef.current; if (!el) return;
    const dx = e.clientX - startX.current;
    // Solo se considera arrastre tras superar un umbral (evita robar clics)
    if (!isDragging.current) {
      if (Math.abs(dx) < 6) return;
      isDragging.current = true;
      didDrag.current    = true;
      setGrabbing(true);
      setSellerPopup(null);
      try { el.setPointerCapture(e.pointerId); } catch { /* noop */ }
    }
    el.scrollLeft = startScroll.current - dx;
    const now = performance.now();
    const dt  = now - prevT.current;
    if (dt > 0) velX.current = (e.clientX - prevX.current) / dt;
    prevX.current = e.clientX;
    prevT.current = now;
  }, []);

  const onPtrUp = useCallback(() => {
    armed.current = false;
    if (!isDragging.current) return;   // fue un clic, no un arrastre → dejar pasar
    isDragging.current = false;
    setGrabbing(false);
    const el = scrollRef.current; if (!el) return;
    try { if (pointerId.current != null) el.releasePointerCapture(pointerId.current); } catch { /* noop */ }
    let v = velX.current * 14;
    const coast = () => {
      if (Math.abs(v) < 0.3) return;
      el.scrollLeft -= v;
      v *= 0.88;
      rafId.current = requestAnimationFrame(coast);
    };
    rafId.current = requestAnimationFrame(coast);
  }, []);

  // Si hubo arrastre real, suprimimos el clic para no navegar por accidente
  const onClickCapture = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (didDrag.current) {
      e.preventDefault();
      e.stopPropagation();
      didDrag.current = false;
    }
  }, []);

  const scroll = (dir: 'izq' | 'der') => {
    const el = scrollRef.current; if (!el) return;
    const CARD_W = 226;
    const count  = Math.max(1, Math.floor(el.clientWidth / CARD_W));
    el.scrollBy({ left: dir === 'der' ? count * CARD_W : -(count * CARD_W), behavior: 'smooth' });
  };

  useEffect(() => {
    if (!autoPlay || !productos.length) return;
    const tick = () => {
      const el = scrollRef.current; if (!el) return;
      if (hovering || isDragging.current) return;
      const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 16;
      el.scrollBy({ left: atEnd ? -el.scrollWidth : 252, behavior: 'smooth' });
    };
    const t = setInterval(tick, 3800);
    return () => clearInterval(t);
  }, [autoPlay, productos.length, hovering]);

  const agregar = useCallback((p: ProductoDestacado) => {
    addItem({ productId: p._id, storeId: p.idTienda, title: p.title, price: p.price, stock: p.stock, sku: p.sku, image: p.images?.[0] });
    setAgregadoId(p._id); setTimeout(() => setAgregadoId(null), 1800); openCart();
  }, [addItem, openCart]);
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true });
  if (!productos.length && !cargando) return null;
  return (
    <section ref={ref}
      className={`py-8 border-t border-[var(--border)] ${urgente ? 'bg-gradient-to-br from-orange-50/40 via-white to-amber-50/30' : 'bg-white'}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}>
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-5">
          <div className="min-w-0 flex-1">
            {badge && (
              <span className={`inline-block text-[9px] bg-gradient-to-r ${gradFrom} ${gradTo} text-white font-black px-2.5 py-1 rounded-full uppercase tracking-[0.18em] shadow-sm mb-2.5`}>
                {badge}
              </span>
            )}
            <h2 className="text-2xl md:text-[28px] font-black text-slate-900 leading-[1.05] tracking-tight">{titulo}</h2>
            <div className="text-[13px] text-slate-500 mt-1.5 flex items-center gap-2 flex-wrap">
              <span>{subtitulo}</span>
              {urgente && (
                <>
                  <span className="inline-block w-1 h-1 rounded-full bg-slate-300" />
                  <span className="inline-flex items-center gap-1.5">
                    <span className="relative flex w-1.5 h-1.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-70 animate-ping" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
                    </span>
                    <span className="font-semibold text-rose-600 tabular-nums">
                      Termina en {String(ctdown.h).padStart(2,'0')}:{String(ctdown.m).padStart(2,'0')}:{String(ctdown.s).padStart(2,'0')}
                    </span>
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <motion.button onClick={() => scroll('izq')} disabled={!puedeIzq}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-full bg-white border border-slate-200 hover:border-slate-900 hover:bg-slate-900 hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-700 flex items-center justify-center transition-all text-slate-700">
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
            <motion.button onClick={() => scroll('der')} disabled={!puedeDer}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-full bg-white border border-slate-200 hover:border-slate-900 hover:bg-slate-900 hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-700 flex items-center justify-center transition-all text-slate-700">
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>

        <div className="relative">
          {cargando ? (
            <div className="flex gap-4 pb-3 overflow-x-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="shrink-0 w-[clamp(220px,65vw,290px)] aspect-[4/5] skeleton rounded-[28px]" />
              ))}
            </div>
          ) : (
          <><div className={`absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none transition-opacity ${puedeIzq ? 'opacity-100' : 'opacity-0'}`} />
          <div className={`absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none transition-opacity ${puedeDer ? 'opacity-100' : 'opacity-0'}`} />
          <div
            ref={scrollRef}
            onPointerDown={onPtrDown}
            onPointerMove={onPtrMove}
            onPointerUp={onPtrUp}
            onPointerCancel={onPtrUp}
            onClickCapture={onClickCapture}
            className={`flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none ${grabbing ? 'cursor-grabbing' : 'cursor-grab'}`}>
            {productos.map((p, i) => (
              <ProductoCard
                key={p._id}
                product={p}
                index={i}
                inView={inView}
                gradFrom={gradFrom}
                gradTo={gradTo}
                isAdded={agregadoId === p._id}
                agregar={agregar}
                openSeller={openSeller}
                closeSeller={closeSeller}
              />
            ))}

          </div>

          {/* ── Progress bar ──────────────────────────────────────────── */}
          <div className="mt-3 h-1 bg-[var(--border)] rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${gradFrom} ${gradTo} rounded-full transition-[width] duration-150 ease-out`}
              style={{ width: `${Math.round(scrollPct * 100)}%` }}
            />
          </div>
          </>
          )}
        </div>
      </div>

      {/* ── Portal: popup flotante del vendedor ─────────────────────── */}
      {mounted && sellerPopup && createPortal(
        <AnimatePresence>
          <motion.div
            key="seller-portal"
            initial={{ opacity: 0, y: sellerPopup.above ? 8 : -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed',
              zIndex: 9999,
              width: 252,
              left: Math.max(8, Math.min(
                sellerPopup.rect.left + sellerPopup.rect.width / 2 - 126,
                window.innerWidth - 260,
              )),
              top: sellerPopup.above
                ? sellerPopup.rect.top - 202
                : sellerPopup.rect.bottom + 10,
            }}
            onMouseEnter={keepSeller}
            onMouseLeave={closeSeller}
            className="bg-white rounded-2xl border border-[var(--border)] shadow-2xl overflow-visible pointer-events-auto">

            {/* Caret */}
            {sellerPopup.above ? (
              <div className="absolute -bottom-[9px] left-1/2 -translate-x-1/2 w-4 h-[10px] overflow-hidden">
                <div className="w-[10px] h-[10px] bg-white border-r border-b border-[var(--border)] rotate-45 -translate-y-[5px] mx-auto shadow-sm" />
              </div>
            ) : (
              <div className="absolute -top-[9px] left-1/2 -translate-x-1/2 w-4 h-[10px] overflow-hidden">
                <div className="w-[10px] h-[10px] bg-white border-l border-t border-[var(--border)] rotate-45 translate-y-[5px] mx-auto shadow-sm" />
              </div>
            )}

            {/* Gradient header */}
            <div className={`bg-gradient-to-r ${gradFrom} ${gradTo} p-3.5 flex items-center gap-3 rounded-t-2xl`}>
              {sellerPopup.product.storeLogo
                ? <img src={sellerPopup.product.storeLogo} alt={sellerPopup.product.nombreTienda}
                    className="w-10 h-10 rounded-xl object-cover border-2 border-white/30 shrink-0 shadow-md" />
                : <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0 border border-white/30">
                    <span className="text-white text-lg font-black leading-none">{sellerPopup.product.nombreTienda[0]?.toUpperCase()}</span>
                  </div>}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate leading-tight">{sellerPopup.product.nombreTienda}</p>
                <span className="text-[11px] text-white/85 flex items-center gap-1 mt-0.5">
                  <BadgeCheck className="w-3 h-3 shrink-0" /> Vendedor verificado
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-3.5">
              {sellerPopup.product.storeDescription ? (
                <p className="text-xs text-[var(--text-muted)] line-clamp-3 leading-relaxed mb-3">
                  {sellerPopup.product.storeDescription}
                </p>
              ) : (
                <p className="text-xs text-[var(--text-muted)] italic mb-3 opacity-60">Sin descripción disponible.</p>
              )}
              <Link
                href={`/store/${sellerPopup.product.slugTienda}`}
                className={`flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r ${gradFrom} ${gradTo} text-white text-xs font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all`}>
                Ver tienda completa <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body,
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TIENDA CARD — 3D tilt + shine sweep + logo bounce
═══════════════════════════════════════════════════════════════════ */
const TiendaCard = memo(function TiendaCard({ tienda, index, inView }: {
  tienda: TipoTienda; index: number; inView: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const rotX  = useMotionValue(0);
  const rotY  = useMotionValue(0);
  const sRotX = useSpring(rotX, { stiffness: 260, damping: 28, mass: 0.5 });
  const sRotY = useSpring(rotY, { stiffness: 260, damping: 28, mass: 0.5 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
    const dy = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
    rotY.set( dx * 4);
    rotX.set(-dy * 4);
  };
  const onLeave = () => { rotX.set(0); rotY.set(0); };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 24, scale: 0.94 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ delay: Math.min(index * 0.06, 0.4), type: 'spring', stiffness: 200, damping: 24 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileHover={{ y: -6 }}
      style={{ rotateX: sRotX, rotateY: sRotY, transformPerspective: 1200 }}
      className="shrink-0 w-[clamp(180px,calc(55vw-1.5rem),235px)] relative bg-white border border-[var(--border)] rounded-2xl overflow-hidden group transition-shadow duration-300 hover:shadow-2xl hover:shadow-slate-300/60 hover:border-[var(--accent-border)] will-change-transform">

      {/* Glow naranja sutil */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-20"
        style={{ boxShadow: 'inset 0 0 24px rgba(255,153,0,0.05), 0 18px 40px -12px rgba(255,153,0,0.22)' }}
      />

      <Link href={`/store/${tienda.slug}`} className="block">
        <div className="h-28 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center relative overflow-hidden">
          {/* Shine sweep */}
          <div className="absolute inset-y-0 -inset-x-1/3 -translate-x-full group-hover:translate-x-[250%] transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] bg-gradient-to-r from-transparent via-white/45 to-transparent skew-x-12 pointer-events-none" />

          {tienda.logo_url
            ? <motion.img
                src={tienda.logo_url}
                alt={tienda.name}
                whileHover={{ rotate: [0, -4, 4, 0], transition: { duration: 0.55 } }}
                className="w-16 h-16 rounded-2xl object-cover shadow-lg z-10 group-hover:scale-110 transition-transform duration-300" />
            : <motion.div
                whileHover={{ rotate: [0, -4, 4, 0], transition: { duration: 0.55 } }}
                className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg z-10 group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-2xl font-black">{tienda.name[0]?.toUpperCase()}</span>
              </motion.div>}

          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 shadow-sm z-10">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-green-700">Activa</span>
          </div>
        </div>
        <div className="p-4 relative">
          <h3 className="text-sm font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--blue)] transition-colors mb-0.5">{tienda.name}</h3>
          {tienda.description && <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-2">{tienda.description}</p>}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[10px] text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-semibold">
              <BadgeCheck className="w-3 h-3" /> Verificada
            </span>
            <span className="text-[11px] text-[var(--blue)] font-semibold group-hover:underline inline-flex items-center gap-0.5">
              Ver tienda <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
});

/* ═══════════════════════════════════════════════════════════════════
   CARRUSEL DE TIENDAS
═══════════════════════════════════════════════════════════════════ */
function CarruselTiendas({ tiendas, cargando }: { tiendas: TipoTienda[]; cargando?: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [puedeIzq, setPuedeIzq] = useState(false);
  const [puedeDer, setPuedeDer] = useState(true);
  const actualizar = useCallback(() => {
    const el = scrollRef.current; if (!el) return;
    setPuedeIzq(el.scrollLeft > 8);
    setPuedeDer(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);
  useEffect(() => {
    const el = scrollRef.current; if (!el) return;
    el.addEventListener('scroll', actualizar, { passive: true }); actualizar();
    return () => el.removeEventListener('scroll', actualizar);
  }, [actualizar, tiendas]);
  const scroll = (dir: 'izq' | 'der') => scrollRef.current?.scrollBy({ left: dir === 'der' ? 700 : -700, behavior: 'smooth' });
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  if (!tiendas.length && !cargando) return null;
  return (
    <section ref={ref} className="py-8 border-t border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="white" strokeWidth="2" strokeLinejoin="round" fill="rgba(255,255,255,0.2)"/><rect x="9" y="12" width="6" height="9" rx="1" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.15)"/></svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Tiendas destacadas</h2>
              <p className="text-xs text-[var(--text-muted)]">Verificadas y activas en Colombia</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="#tiendas" className="text-sm text-[var(--blue)] hover:underline font-semibold hidden sm:flex items-center gap-1">
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <div className="flex gap-1.5">
              <button onClick={() => scroll('izq')} disabled={!puedeIzq} className="w-9 h-9 rounded-full border border-[var(--border)] bg-white hover:bg-[var(--surface-2)] disabled:opacity-30 flex items-center justify-center transition-all hover:shadow-md"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => scroll('der')} disabled={!puedeDer} className="w-9 h-9 rounded-full border border-[var(--border)] bg-white hover:bg-[var(--surface-2)] disabled:opacity-30 flex items-center justify-center transition-all hover:shadow-md"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </motion.div>
        <div className="relative">
          {cargando ? (
            <div className="flex gap-4 pb-3 overflow-x-hidden">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="shrink-0 w-[clamp(180px,calc(55vw-1.5rem),235px)] h-[200px] skeleton rounded-2xl" />
              ))}
            </div>
          ) : (
          <><div className={`absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-[var(--bg)] to-transparent z-10 pointer-events-none transition-opacity ${puedeIzq ? 'opacity-100' : 'opacity-0'}`} />
          <div className={`absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-[var(--bg)] to-transparent z-10 pointer-events-none transition-opacity ${puedeDer ? 'opacity-100' : 'opacity-0'}`} />
          <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth">
            {tiendas.map((t, i) => (
              <TiendaCard key={t.id} tienda={t} index={i} inView={inView} />
            ))}
          </div></>
          )}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CÓMO FUNCIONA — con íconos SVG reales y línea de conexión
═══════════════════════════════════════════════════════════════════ */
const PASOS = [
  {
    num: '01', titulo: 'Explora tiendas',
    desc: 'Navega entre cientos de tiendas verificadas con productos únicos de Colombia.',
    gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-200',
    svg: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <circle cx="22" cy="22" r="12" stroke="white" strokeWidth="3" fill="rgba(255,255,255,0.15)"/>
        <path d="M31 31l8 8" stroke="white" strokeWidth="3" strokeLinecap="round"/>
        <path d="M18 22h8M22 18v8" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    num: '02', titulo: 'Agrega al carrito',
    desc: 'Compra de varias tiendas en una sola experiencia sin complicaciones.',
    gradient: 'from-orange-500 to-amber-500', shadow: 'shadow-orange-200',
    svg: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <path d="M6 8h4l5 20h20l4-14H14" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="rgba(255,255,255,0.15)"/>
        <circle cx="18" cy="34" r="3" fill="white"/><circle cx="30" cy="34" r="3" fill="white"/>
        <path d="M24 16v8M20 20h8" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    num: '03', titulo: 'Pago 100% seguro',
    desc: 'Paga con PSE, Nequi, Daviplata o tarjeta. Todo protegido con SSL 256-bit.',
    gradient: 'from-green-500 to-emerald-600', shadow: 'shadow-green-200',
    svg: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <path d="M24 6L10 12v10c0 9 6 17 14 20 8-3 14-11 14-20V12L24 6z" stroke="white" strokeWidth="3" strokeLinejoin="round" fill="rgba(255,255,255,0.15)"/>
        <path d="M17 24l5 5 9-9" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

function ComoFunciona() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <section id="como-funciona" ref={ref} className="py-12 px-4 md:px-6 border-t border-[var(--border)] bg-gradient-to-b from-[var(--surface-2)] to-white">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} className="text-center mb-10">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3 px-4 py-1.5 bg-[var(--surface-3)] rounded-full">Simple y rápido</span>
          <h2 className="text-3xl md:text-4xl font-black text-[var(--text-primary)]">¿Cómo funciona?</h2>
          <p className="text-[var(--text-muted)] mt-2 max-w-md mx-auto text-sm">En tres pasos tienes tu compra lista para llegar a tu puerta</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Línea de conexión desktop */}
          <div className="hidden md:block absolute top-16 left-[calc(16.7%+2px)] right-[calc(16.7%+2px)] h-0.5 z-0">
            <motion.div initial={{ scaleX: 0 }} animate={inView ? { scaleX: 1 } : {}}
              transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="h-full bg-gradient-to-r from-blue-300 via-orange-300 to-green-300 origin-left rounded-full" />
          </div>

          {PASOS.map((paso, i) => (
            <motion.div key={paso.num}
              initial={{ opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.15, duration: 0.55 }}
              whileHover={{ y: -8 }}
              className="relative bg-white rounded-3xl border border-[var(--border)] p-8 text-center shadow-sm hover:shadow-2xl hover:shadow-slate-200/80 transition-all group z-10">
              {/* Número de fondo decorativo */}
              <span className="absolute top-4 right-5 text-6xl font-black text-[var(--border)] opacity-30 select-none leading-none">{paso.num}</span>
              {/* Ícono */}
              <div className={`w-20 h-20 bg-gradient-to-br ${paso.gradient} rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xl ${paso.shadow} group-hover:scale-110 transition-transform duration-300`}>
                {paso.svg}
              </div>
              <h3 className="text-lg font-black text-[var(--text-primary)] mb-2">{paso.titulo}</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{paso.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STATS BAR — palette del design system (#FF9900 + #131921)
═══════════════════════════════════════════════════════════════════ */

const STATS_META = [
  {
    etiq: 'Tiendas activas', anillo: 75,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2"/>
        <rect x="9" y="12" width="6" height="9" rx="1"
          stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    etiq: 'Productos', anillo: 83,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M20 7H4a2 2 0 00-2 2v8a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"
          stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2"/>
        <path d="M16 3H8L6 7h12l-2-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    etiq: 'Compradores', anillo: 68,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2"/>
        <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="2"/>
        <path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    etiq: 'Satisfacción', anillo: 98,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z"
          stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2"/>
      </svg>
    ),
  },
];

// Anillo SVG en naranja (único acento del design system)
function AnilloSVG({ porcentaje, activo, retardo }: {
  porcentaje: number; activo: boolean; retardo: number;
}) {
  const r = 38;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full"
      style={{ transform: 'rotate(-90deg)' }}>
      {/* Track */}
      <circle cx="50" cy="50" r={r} fill="none"
        stroke="rgba(255,153,0,0.12)" strokeWidth="4" />
      {/* Fill naranja */}
      <motion.circle
        cx="50" cy="50" r={r}
        fill="none"
        stroke="#FF9900"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={activo ? { strokeDashoffset: c * (1 - porcentaje / 100) } : {}}
        transition={{ duration: 1.6, delay: retardo, ease: [0.22, 1, 0.36, 1] }}
        style={{ filter: 'drop-shadow(0 0 5px rgba(255,153,0,0.5))' }}
      />
    </svg>
  );
}

// Tarjeta con tilt 3D sutil (máx 4°, palette unificada)
function StatCard({ meta, valor, sufijo, index, inView }: {
  meta: typeof STATS_META[0]; valor: number; sufijo: string;
  index: number; inView: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const rotX    = useMotionValue(0);
  const rotY    = useMotionValue(0);
  const sRotX   = useSpring(rotX, { stiffness: 300, damping: 32 });
  const sRotY   = useSpring(rotY, { stiffness: 300, damping: 32 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = ((e.clientX - rect.left)  / rect.width  - 0.5) * 2;
    const dy = ((e.clientY - rect.top)   / rect.height - 0.5) * 2;
    rotX.set(-dy * 4);
    rotY.set( dx * 4);
  };
  const onLeave = () => { rotX.set(0); rotY.set(0); };

  const retardo = index * 0.1;

  return (
    <motion.div
      ref={cardRef}
      style={{ rotateX: sRotX, rotateY: sRotY, transformPerspective: 1000 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: retardo, duration: 0.55, type: 'spring', stiffness: 200, damping: 24 }}
      className="group relative flex flex-col items-center text-center px-4 py-8 rounded-2xl
                 border border-white/[0.07] bg-white/[0.03] cursor-default select-none
                 hover:border-[var(--accent-border)] transition-colors duration-300"
    >
      {/* Glow naranja al hacer hover — sutil */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100
                      transition-opacity duration-500 pointer-events-none"
        style={{ boxShadow: 'inset 0 0 24px rgba(255,153,0,0.07), 0 0 32px rgba(255,153,0,0.08)' }} />

      {/* Anillo + icono */}
      <div className="relative w-20 h-20 mb-5">
        <AnilloSVG porcentaje={meta.anillo} activo={inView} retardo={retardo + 0.3} />
        {/* Pulso suave */}
        <motion.div
          animate={{ scale: [1, 1.14, 1], opacity: [0.1, 0.28, 0.1] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: index * 0.6 }}
          className="absolute inset-2 rounded-full"
          style={{ background: 'radial-gradient(circle, #FF9900 0%, transparent 70%)' }}
        />
        {/* Ícono centrado */}
        <div className="absolute inset-0 flex items-center justify-center text-[var(--accent)]">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center
                          bg-[var(--accent-subtle)]">
            {meta.icon}
          </div>
        </div>
      </div>

      {/* Número */}
      <div className="text-4xl md:text-5xl font-black leading-none tabular-nums">
        {/* Dígitos en blanco, sufijo en naranja */}
        <span className="text-white">
          <ContadorSpring objetivo={valor} sufijo="" retardo={retardo + 0.15} />
        </span>
        <span className="text-[var(--accent)]">{sufijo}</span>
      </div>

      {/* Etiqueta */}
      <p className="mt-2.5 text-[11px] font-bold uppercase tracking-widest text-white/35">
        {meta.etiq}
      </p>

      {/* Línea de acento animada */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ delay: retardo + 0.8, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="absolute bottom-0 inset-x-8 h-px rounded-full origin-left"
        style={{ background: 'linear-gradient(to right, transparent, #FF9900, transparent)' }}
      />
    </motion.div>
  );
}

function StatsBar({ stats }: { stats: { valor: number; sufijo: string; etiq: string }[] }) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="relative py-12 border-t border-white/[0.06] bg-[var(--nav-bg)] overflow-hidden">
      {/* Un solo blob naranja muy sutil — en palette */}
      <motion.div
        animate={{ x: [0, 60, -40, 0], y: [0, -50, 40, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-40 right-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,153,0,0.06) 0%, transparent 70%)' }}
      />
      <div className="max-w-6xl mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {STATS_META.map((meta, i) => (
            <StatCard
              key={meta.etiq}
              meta={meta}
              valor={stats[i]?.valor ?? 0}
              sufijo={stats[i]?.sufijo ?? ''}
              index={i}
              inView={inView}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MÉTODOS DE PAGO — con logos SVG reales
═══════════════════════════════════════════════════════════════════ */
const METODOS_PAGO = [
  {
    etiq: 'PSE', desc: 'Pago bancario directo',
    bg: 'from-[#003087] to-[#0060A8]', shadow: 'shadow-blue-300/50',
    svg: <svg viewBox="0 0 80 30" className="w-16 h-8"><text x="4" y="22" fill="white" fontSize="20" fontWeight="900" fontFamily="Arial">PSE</text><path d="M60 8h16v14H60z" fill="rgba(255,255,255,0.15)" rx="2"/><path d="M62 15h12M62 11h8M62 19h10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  },
  {
    etiq: 'Nequi', desc: 'Billetera digital',
    bg: 'from-[#6B11C9] to-[#9B59B6]', shadow: 'shadow-purple-300/50',
    svg: <svg viewBox="0 0 80 30" className="w-16 h-8"><text x="4" y="22" fill="white" fontSize="16" fontWeight="900" fontFamily="Arial">Nequi</text><circle cx="68" cy="15" r="7" fill="rgba(255,255,255,0.2)"/><path d="M65 15l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
  {
    etiq: 'Daviplata', desc: 'Pago móvil',
    bg: 'from-[#CC0000] to-[#FF4444]', shadow: 'shadow-red-300/50',
    svg: <svg viewBox="0 0 100 30" className="w-20 h-8"><text x="4" y="22" fill="white" fontSize="13" fontWeight="900" fontFamily="Arial">Daviplata</text></svg>,
  },
  {
    etiq: 'Visa', desc: 'Crédito / Débito',
    bg: 'from-[#1A1F71] to-[#2557D6]', shadow: 'shadow-indigo-300/50',
    svg: <svg viewBox="0 0 80 30" className="w-16 h-8"><text x="4" y="24" fill="white" fontSize="22" fontWeight="900" fontFamily="Arial" fontStyle="italic">VISA</text></svg>,
  },
  {
    etiq: 'Mastercard', desc: 'Crédito / Débito',
    bg: 'from-[#EB001B] to-[#FF5F00]', shadow: 'shadow-orange-300/50',
    svg: (
      <svg viewBox="0 0 80 30" className="w-16 h-8">
        <circle cx="28" cy="15" r="10" fill="#EB001B" opacity="0.9"/>
        <circle cx="44" cy="15" r="10" fill="#F79E1B" opacity="0.9"/>
        <path d="M36 8a10 10 0 010 14 10 10 0 010-14z" fill="#FF5F00"/>
      </svg>
    ),
  },
];

function MetodosPago() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <section ref={ref} className="py-10 border-t border-[var(--border)] bg-white px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row items-center gap-8">
          <div className="shrink-0 text-center md:text-left">
            <div className="flex items-center gap-2.5 justify-center md:justify-start mb-1">
              <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-green-200">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M12 2l2.4 5H20l-4.5 3.5 1.5 5.5L12 13l-5 3 1.5-5.5L4 7h5.6L12 2z" fill="white"/></svg>
              </div>
              <h3 className="text-lg font-black text-[var(--text-primary)]">Pagos 100% seguros</h3>
            </div>
            <p className="text-sm text-[var(--text-muted)]">Cifrado SSL 256-bit en cada transacción</p>
            <div className="flex items-center gap-1.5 mt-2 justify-center md:justify-start">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-600 font-semibold">Sistema activo y seguro</span>
            </div>
          </div>

          <div className="flex-1 flex flex-wrap gap-3 justify-center md:justify-end">
            {METODOS_PAGO.map((m, i) => (
              <motion.div key={m.etiq}
                initial={{ opacity: 0, scale: 0.85, y: 12 }}
                animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
                transition={{ delay: i * 0.08, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                whileHover={{ scale: 1.08, y: -4, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.97 }}
                className={`flex flex-col items-center gap-1.5 bg-gradient-to-br ${m.bg} rounded-2xl px-5 py-3.5 shadow-lg ${m.shadow} cursor-default min-w-[80px] group transition-all hover:shadow-2xl`}>
                <div className="flex items-center justify-center h-8">
                  {m.svg}
                </div>
                <p className="text-[10px] text-white/70 font-medium leading-tight text-center">{m.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   GRID DE TIENDAS
═══════════════════════════════════════════════════════════════════ */
function GridTiendas({ tiendas, cargando }: { tiendas: TipoTienda[]; cargando: boolean }) {
  const [busqueda, setBusqueda] = useState('');
  const filtradas = tiendas.filter(t =>
    t.name.toLowerCase().includes(busqueda.toLowerCase()) ||
    t.description?.toLowerCase().includes(busqueda.toLowerCase())
  );
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <section id="tiendas" ref={ref} className="py-12 px-4 md:px-6 border-t border-[var(--border)]">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black text-[var(--text-primary)]">Todas las tiendas</h2>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">{filtradas.length} tiendas disponibles</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar tiendas..."
              className="w-full pl-10 pr-4 py-3 text-sm bg-white border border-[var(--border)] hover:border-[var(--accent)] focus:border-[var(--accent)] focus:ring-2 focus:ring-orange-100 rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-all shadow-sm" />
          </div>
        </motion.div>

        {cargando && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => <div key={i} className="skeleton h-52 rounded-2xl" />)}
          </div>
        )}

        {!cargando && filtradas.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-20 h-20 bg-[var(--surface-2)] rounded-3xl flex items-center justify-center mb-4">
              <Store className="w-9 h-9 text-[var(--border-hover)]" />
            </div>
            <p className="text-[var(--text-secondary)] font-semibold mb-1">No se encontraron tiendas</p>
            <p className="text-sm text-[var(--text-muted)]">Intenta con otro término</p>
            {busqueda && <button onClick={() => setBusqueda('')} className="mt-4 text-sm text-[var(--blue)] hover:underline font-medium">Limpiar búsqueda</button>}
          </div>
        )}

        {!cargando && filtradas.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <AnimatePresence mode="popLayout">
              {filtradas.map((t, i) => (
                <motion.div key={t.id}
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3), type: 'spring', stiffness: 280, damping: 22 }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}>
                  <Link href={`/store/${t.slug}`} className="block bg-white border border-[var(--border)] rounded-2xl overflow-hidden group transition-all h-full hover:shadow-xl hover:shadow-slate-200/80 hover:border-[var(--accent-border)]">
                    <div className="h-28 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center relative overflow-hidden">
                      {t.logo_url
                        ? <img src={t.logo_url} alt={t.name} className="w-14 h-14 rounded-2xl object-cover shadow-lg z-10" />
                        : <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg z-10">
                            <span className="text-white text-2xl font-black">{t.name[0]?.toUpperCase()}</span>
                          </div>}
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-1.5 py-0.5 z-10">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      </div>
                    </div>
                    <div className="p-3.5">
                      <h3 className="text-sm font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--blue)] transition-colors">{t.name}</h3>
                      {t.description && <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-1 mb-2">{t.description}</p>}
                      <div className="flex items-center gap-1">
                        <BadgeCheck className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-[10px] text-green-600 font-semibold">Verificada</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   BANNER VENDEDORES
═══════════════════════════════════════════════════════════════════ */
function BannerVendedores({ user }: { user: unknown }) {
  if (user) return null;
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  // ── Parallax 3D tilt del dashboard ──────────────────────────────
  const cardRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 160, damping: 18 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), { stiffness: 160, damping: 18 });
  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width  - 0.5);
    my.set((e.clientY - r.top)  / r.height - 0.5);
  };
  const resetTilt = () => { mx.set(0); my.set(0); };

  // ── Contador animado de ventas ──────────────────────────────────
  const ventas        = useMotionValue(0);
  const ventasSpring  = useSpring(ventas, { stiffness: 30, damping: 22, restDelta: 50 });
  const ventasDisplay = useTransform(ventasSpring, v => fmt(Math.round(v)));
  useEffect(() => { if (inView) ventas.set(2_450_000); }, [inView, ventas]);

  // ── Notificaciones en vivo cíclicas ─────────────────────────────
  const notifs = [
    { icon: ShoppingBag, color: 'text-green-600',  bg: 'bg-green-50',  title: '¡Nueva venta!',       desc: '+$185.000 · Camiseta premium' },
    { icon: Star,        color: 'text-amber-600',  bg: 'bg-amber-50',  title: 'Reseña 5 estrellas',  desc: 'María: "Excelente calidad"' },
    { icon: Eye,         color: 'text-blue-600',   bg: 'bg-blue-50',   title: '12 personas viendo',  desc: 'Tu tienda en este momento' },
    { icon: Truck,       color: 'text-violet-600', bg: 'bg-violet-50', title: 'Pedido enviado',      desc: 'Orden #4521 en camino' },
  ];
  const [notiIdx, setNotiIdx] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const t = setInterval(() => setNotiIdx(i => (i + 1) % notifs.length), 2800);
    return () => clearInterval(t);
  }, [inView, notifs.length]);
  const noti     = notifs[notiIdx];
  const NotiIcon = noti.icon;

  // ── Mini bar chart ──────────────────────────────────────────────
  const bars = [35, 50, 42, 65, 55, 80, 92];

  // ── Cards flotantes con íconos reales ───────────────────────────
  const floats = [
    { icon: TrendingUp,  label: '+124% crecimiento', grad: 'from-green-500 to-emerald-600', pos: '-top-3 -left-6',       dur: 4,   d: 0   },
    { icon: Users,       label: '+12k compradores',  grad: 'from-blue-500 to-indigo-600',   pos: 'top-20 -right-10',     dur: 4.5, d: 0.4 },
    { icon: ShieldCheck, label: 'Pagos protegidos',  grad: 'from-violet-500 to-purple-600', pos: 'bottom-24 -left-12',   dur: 5,   d: 0.8 },
    { icon: Zap,         label: 'Setup en 5 min',    grad: 'from-orange-500 to-amber-500',  pos: '-bottom-2 -right-4',   dur: 4.2, d: 1.1 },
  ];

  return (
    <section id="vende" ref={ref}
      className="py-14 px-4 md:px-6 bg-[var(--nav-bg)] border-t border-[var(--border)] relative overflow-hidden">

      {/* Glow ambient orbs */}
      <motion.div animate={{ x: [0, 40, 0], y: [0, -25, 0] }} transition={{ duration: 9,  repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-0 left-1/4 w-[480px] h-[480px] rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
      <motion.div animate={{ x: [0, -30, 0], y: [0, 30, 0] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-0 right-1/4 w-[480px] h-[480px] rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">

        {/* ── IZQUIERDA: copy + CTA ─────────────────────────────── */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6 }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-5">
            <Sparkles className="w-3.5 h-3.5" /> Vende en Colombia
          </motion.div>

          <h2 className="text-3xl md:text-5xl font-black text-white leading-[1.05] mb-5">
            Convierte tu pasión<br />
            en una <span className="text-[var(--accent)]">tienda exitosa</span>
          </h2>
          <p className="text-white/60 text-base md:text-lg mb-7 max-w-lg leading-relaxed">
            Más de <span className="font-bold text-white">1.200 vendedores</span> ya facturan con Shopper.
            Setup en 5 minutos · 0% comisión los primeros 90 días.
          </p>

          {/* Chips de beneficios */}
          <div className="flex flex-wrap gap-2 mb-7">
            {[
              { icon: ShieldCheck, txt: 'Pagos protegidos' },
              { icon: Truck,       txt: 'Logística incluida' },
              { icon: BarChart3,   txt: 'Panel pro' },
              { icon: Users,       txt: 'Soporte 24/7' },
            ].map((b, i) => {
              const I = b.icon;
              return (
                <motion.span key={i} initial={{ opacity: 0, y: 8 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.3 + i * 0.07, duration: 0.4 }}
                  className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-white/80 px-3 py-1.5 rounded-full text-xs font-semibold">
                  <I className="w-3.5 h-3.5 text-orange-400" /> {b.txt}
                </motion.span>
              );
            })}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/auth/register"
              className="group relative inline-flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold px-7 py-4 rounded-2xl text-base overflow-hidden transition-all hover:shadow-2xl hover:shadow-orange-500/40 hover:-translate-y-0.5 active:scale-95">
              <span className="relative z-10 inline-flex items-center gap-2">
                <Crown className="w-5 h-5" /> Abrir mi tienda gratis
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              {/* Shine sweep */}
              <motion.div
                animate={{ x: ['-150%', '250%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
                className="absolute inset-y-0 w-2/5 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 pointer-events-none" />
            </Link>
            <Link href="/auth/login"
              className="inline-flex items-center justify-center gap-2 border border-white/20 text-white hover:bg-white/10 font-medium px-7 py-4 rounded-2xl text-base transition-all">
              Ya tengo cuenta
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-white/40 text-xs mt-5">
            <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-400" /> Sin tarjeta</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-400" /> Soporte incluido</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-400" /> Cancela cuando quieras</span>
          </div>
        </motion.div>

        {/* ── DERECHA: dashboard mock 3D + cards flotantes ──────── */}
        <motion.div initial={{ opacity: 0, x: 30 }} animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative mx-auto w-full max-w-md" style={{ perspective: 1200 }}>

          {/* Cards flotantes orbitando — íconos reales */}
          {floats.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div key={i}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={inView ? { opacity: 1, scale: 1, y: [0, -10, 0] } : {}}
                transition={{
                  opacity: { delay: 0.7 + i * 0.12, duration: 0.4 },
                  scale:   { delay: 0.7 + i * 0.12, type: 'spring', stiffness: 220, damping: 14 },
                  y:       { duration: f.dur, repeat: Infinity, ease: 'easeInOut', delay: f.d },
                }}
                className={`absolute ${f.pos} z-20 hidden md:block`}>
                <div className="bg-white shadow-2xl shadow-black/40 rounded-2xl pl-2 pr-3.5 py-2 flex items-center gap-2 border border-white/40">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${f.grad} flex items-center justify-center shadow-md shrink-0`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 whitespace-nowrap">{f.label}</span>
                </div>
              </motion.div>
            );
          })}

          {/* Dashboard card con parallax 3D */}
          <motion.div
            ref={cardRef}
            onMouseMove={handleMove}
            onMouseLeave={resetTilt}
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
            className="relative bg-white rounded-3xl shadow-2xl shadow-black/50 overflow-hidden border border-white/10">

            {/* Header de tienda */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <div className="leading-tight">
                  <p className="text-white text-sm font-bold">Mi Tienda</p>
                  <p className="text-white/50 text-[10px] flex items-center gap-1">
                    <BadgeCheck className="w-3 h-3 text-blue-400" /> Vendedor verificado
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-[10px] font-black border border-green-500/30">
                <motion.div animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                EN VIVO
              </div>
            </div>

            {/* Stat principal */}
            <div className="p-5 pb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Ventas hoy</p>
              <div className="flex items-end gap-2 mb-1">
                <motion.span className="text-3xl font-black text-slate-900 tabular-nums leading-none">{ventasDisplay}</motion.span>
                <span className="text-xs font-bold text-green-600 mb-0.5 flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> +24%
                </span>
              </div>
              <p className="text-[11px] text-slate-500">vs. ayer · meta mensual al 78%</p>
            </div>

            {/* Mini bar chart */}
            <div className="px-5 pb-1 flex items-end gap-1.5 h-16">
              {bars.map((h, i) => (
                <motion.div key={i}
                  initial={{ height: 0 }}
                  animate={inView ? { height: `${h}%` } : {}}
                  transition={{ delay: 0.9 + i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className={`flex-1 rounded-t-md ${
                    i === bars.length - 1
                      ? 'bg-gradient-to-t from-orange-500 to-amber-400 shadow-md shadow-orange-300'
                      : 'bg-gradient-to-t from-slate-200 to-slate-300'
                  }`} />
              ))}
            </div>
            <div className="px-5 pb-3 flex justify-between text-[9px] font-bold mt-1">
              {['L','M','M','J','V','S','D'].map((d, i) => (
                <span key={i} className={`flex-1 text-center ${i === 6 ? 'text-orange-500' : 'text-slate-400'}`}>{d}</span>
              ))}
            </div>

            {/* KPIs en fila */}
            <div className="px-5 pb-4 grid grid-cols-3 gap-2">
              {[
                { icon: ShoppingBag, lbl: 'Pedidos', val: '47',   color: 'text-orange-600 bg-orange-50' },
                { icon: Eye,         lbl: 'Visitas', val: '1.2k', color: 'text-blue-600 bg-blue-50' },
                { icon: Star,        lbl: 'Rating',  val: '4.9',  color: 'text-amber-600 bg-amber-50' },
              ].map((s, i) => {
                const I = s.icon;
                return (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 1.3 + i * 0.08, duration: 0.4 }}
                    className="bg-slate-50 rounded-xl p-2.5 text-center">
                    <div className={`w-7 h-7 rounded-lg ${s.color} mx-auto mb-1 flex items-center justify-center`}>
                      <I className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-black text-slate-900 tabular-nums leading-none">{s.val}</p>
                    <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wide mt-0.5">{s.lbl}</p>
                  </motion.div>
                );
              })}
            </div>

            {/* Notificación en vivo cíclica */}
            <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3 h-[64px] flex items-center overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div key={notiIdx}
                  initial={{ opacity: 0, x: 24, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0,  scale: 1 }}
                  exit={{   opacity: 0, x: -24, scale: 0.96 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-3 w-full">
                  <div className={`w-9 h-9 rounded-xl ${noti.bg} flex items-center justify-center shrink-0`}>
                    <NotiIcon className={`w-4 h-4 ${noti.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 leading-tight">{noti.title}</p>
                    <p className="text-[11px] text-slate-500 truncate leading-tight mt-0.5">{noti.desc}</p>
                  </div>
                  <Bell className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
═══════════════════════════════════════════════════════════════════ */
export default function PaginaPrincipal() {
  const { user } = useAuthStore();
  const [tiendas,     setTiendas]     = useState<TipoTienda[]>([]);
  const [destacados,  setDestacados]  = useState<ProductoDestacado[]>([]);
  const [ofertas,     setOfertas]     = useState<ProductoDestacado[]>([]);
  const [presupuesto, setPresupuesto] = useState<ProductoDestacado[]>([]);
  const [cargando,    setCargando]    = useState(true);
  const [statsReales, setStatsReales] = useState<{ tiendas: number; productos: number; compradores: number; satisfaccion: number } | null>(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [storesRes, destacadosRes, ofertasRes, presupuestoRes] = await Promise.all([
          api.get('/stores'),
          api.get('/products/search?limit=18'),
          api.get('/products/search?hasDiscount=true&sortBy=discount&limit=12'),
          api.get('/products/search?sortBy=price_asc&maxPrice=250000&limit=12'),
        ]);
        const pub: TipoTienda[] = storesRes.data.filter((t: TipoTienda) => t.is_published);
        setTiendas(pub);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapear = (arr: any[]) => arr.map((p: any) => ({
          ...p,
          nombreTienda: p.storeName ?? '',
          slugTienda:   p.storeSlug ?? '',
          idTienda:     p.store_id  ?? '',
        }));
        setDestacados(mapear(destacadosRes.data.resultados   ?? []));
        setOfertas(mapear(ofertasRes.data.resultados         ?? []));
        setPresupuesto(mapear(presupuestoRes.data.resultados ?? []));
      } catch { } finally { setCargando(false); }
    };
    const cargarStats = async () => {
      try { const res = await api.get('/stats'); setStatsReales(res.data); } catch { }
    };
    cargar(); cargarStats();
  }, []);

  const STATS = [
    { valor: statsReales?.tiendas     ?? (tiendas.length || 50),  sufijo: '+', etiq: 'Tiendas activas'  },
    { valor: statsReales?.productos   ?? 1200,                     sufijo: '+', etiq: 'Productos'        },
    { valor: statsReales?.compradores ?? 850,                      sufijo: '+', etiq: 'Compradores'      },
    { valor: statsReales?.satisfaccion ?? 98,                      sufijo: '%', etiq: 'Satisfacción'     },
  ];

  return (
    <div className="min-h-screen fondo-mesh text-[var(--text-primary)] overflow-x-hidden">
      <TickerAnuncios />
      <HeroSlider />
      <GridCategorias />
      <CarruselProductos
        productos={ofertas} cargando={cargando}
        titulo="Ofertas especiales" subtitulo="Precios rebajados por tiempo limitado"
        badge="OFERTA"
        gradFrom="from-red-500" gradTo="to-rose-600" shadowC="shadow-red-200"
        urgente autoPlay
      />
      <CarruselProductos
        productos={destacados} cargando={cargando}
        titulo="Productos destacados" subtitulo="Los más populares de nuestras tiendas"
        badge="HOT"
      />
      <CarruselProductos
        productos={presupuesto} cargando={cargando}
        titulo="Menos de $250.000" subtitulo="Calidad al mejor precio"
        badge="PRECIO"
        gradFrom="from-green-500" gradTo="to-emerald-600" shadowC="shadow-green-200"
      />
      <CarruselTiendas tiendas={tiendas} cargando={cargando} />
      <MetodosPago />
      <StatsBar stats={STATS} />
      <ComoFunciona />
      <GridTiendas tiendas={tiendas} cargando={cargando} />
      <BannerVendedores user={user} />
    </div>
  );
}
