'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  motion, AnimatePresence, useInView,
} from 'framer-motion';
import {
  Search, Store, ArrowRight, X,
  ChevronLeft, ChevronRight, Package,
  Star, CheckCircle, ShoppingCart,
  Flame, BadgeCheck, ShoppingBag,
  Sparkles, Crown,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { Store as TipoTienda, Product as TipoProducto } from '@/types';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

function ContadorAnimado({ objetivo, sufijo = '' }: { objetivo: number; sufijo?: string }) {
  const [conteo, setConteo] = useState(0);
  const ref = useRef(null);
  const enVista = useInView(ref, { once: true });
  useEffect(() => {
    if (!enVista) return;
    let actual = 0;
    const paso = objetivo / (1800 / 16);
    const t = setInterval(() => {
      actual += paso;
      if (actual >= objetivo) { setConteo(objetivo); clearInterval(t); }
      else setConteo(Math.floor(actual));
    }, 16);
    return () => clearInterval(t);
  }, [enVista, objetivo]);
  return <span ref={ref}>{conteo.toLocaleString('es-CO')}{sufijo}</span>;
}

type ProductoDestacado = TipoProducto & { nombreTienda: string; slugTienda: string; idTienda: string };

/* ═══════════════════════════════════════════════════════════════════
   TICKER
═══════════════════════════════════════════════════════════════════ */
const MENSAJES_TICKER = [
  '🚚 Envío gratis en pedidos mayores a $150.000',
  '🔒 Pagos 100% seguros con SSL 256-bit',
  '✅ +1.200 tiendas verificadas en Colombia',
  '💳 Acepta PSE · Nequi · Daviplata · Tarjetas',
  '⭐ Satisfacción garantizada o te devolvemos tu dinero',
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
        {doble.map((msg, i) => <span key={i} className="text-xs text-white/80 px-10 shrink-0">{msg}</span>)}
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
    cta: 'Explorar ahora', ctaLink: '#tiendas', accent: '#FF9900', emoji: '🛍️' },
  { id: 1, bg: 'from-teal-800 to-teal-900', badge: 'Pago seguro', badgeColor: 'bg-yellow-400',
    title: 'Compra con total\nconfianza', subtitle: 'PSE, Nequi, Daviplata y tarjetas. Todo protegido con SSL 256-bit.',
    cta: 'Cómo funciona', ctaLink: '#como-funciona', accent: '#FFD814', emoji: '🔒' },
  { id: 2, bg: 'from-orange-700 to-red-800', badge: '¿Eres vendedor?', badgeColor: 'bg-white',
    title: 'Abre tu tienda\ngratis hoy', subtitle: 'Sin comisiones iniciales. Llega a miles de compradores en Colombia.',
    cta: 'Comenzar gratis', ctaLink: '/auth/register', accent: '#FFD814', emoji: '🚀' },
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
          initial={d => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 })}
          animate={{ x: 0, opacity: 1, transition: { duration: 0.55, ease: [0.32, 0.72, 0, 1] } }}
          exit={d => ({ x: d > 0 ? '-100%' : '100%', opacity: 0, transition: { duration: 0.45 } })}
          className={`absolute inset-0 bg-gradient-to-r ${s.bg} flex items-center`}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
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
            <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 18 }}
              className="hidden md:flex text-[clamp(80px,10vw,140px)] select-none"
              style={{ filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.3))' }}>{s.emoji}</motion.div>
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
    titulo: 'Moda y Ropa', href: '#tiendas',
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
    titulo: 'Hogar y Deco', href: '#tiendas',
    bg: 'from-blue-500 to-indigo-600',
    shadow: 'shadow-blue-200',
    svg: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
        <path d="M4 14L16 4l12 10v14H20v-8h-8v8H4V14z" stroke="white" strokeWidth="2" strokeLinejoin="round" fill="rgba(255,255,255,0.15)"/>
      </svg>
    ),
  },
  {
    titulo: 'Tecnología', href: '#tiendas',
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
    titulo: 'Artesanías', href: '#tiendas',
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
    titulo: 'Alimentos', href: '#tiendas',
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
    titulo: 'Deportes', href: '#tiendas',
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
    titulo: 'Belleza', href: '#tiendas',
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
    titulo: 'Niños', href: '#tiendas',
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
   CARRUSEL DE PRODUCTOS
═══════════════════════════════════════════════════════════════════ */
function CarruselProductos({ productos }: { productos: ProductoDestacado[] }) {
  const { addItem, openCart } = useCartStore();
  const [agregadoId, setAgregadoId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [puedeIzq, setPuedeIzq] = useState(false);
  const [puedeDer, setPuedeDer] = useState(true);
  const actualizarBotones = useCallback(() => {
    const el = scrollRef.current; if (!el) return;
    setPuedeIzq(el.scrollLeft > 8);
    setPuedeDer(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);
  useEffect(() => {
    const el = scrollRef.current; if (!el) return;
    el.addEventListener('scroll', actualizarBotones, { passive: true });
    actualizarBotones();
    return () => el.removeEventListener('scroll', actualizarBotones);
  }, [actualizarBotones, productos]);
  const scroll = (dir: 'izq' | 'der') => scrollRef.current?.scrollBy({ left: dir === 'der' ? 900 : -900, behavior: 'smooth' });
  const agregar = (p: ProductoDestacado) => {
    addItem({ productId: p._id, storeId: p.idTienda, title: p.title, price: p.price, stock: p.stock, sku: p.sku, image: p.images?.[0] });
    setAgregadoId(p._id); setTimeout(() => setAgregadoId(null), 1800); openCart();
  };
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  if (!productos.length) return null;
  return (
    <section ref={ref} className="py-8 border-t border-[var(--border)] bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M12 2l1.5 4.5H18l-3.75 2.75 1.5 4.5L12 11 8.25 13.75l1.5-4.5L6 6.5h4.5L12 2z" fill="white"/><path d="M5 18h14M7 22h10" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Productos destacados</h2>
              <p className="text-xs text-[var(--text-muted)]">Los más populares de nuestras tiendas</p>
            </div>
            <span className="text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold px-2.5 py-1 rounded-full shadow-sm">HOT 🔥</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => scroll('izq')} disabled={!puedeIzq}
              className="w-9 h-9 rounded-full border border-[var(--border)] bg-white hover:bg-[var(--surface-2)] disabled:opacity-30 flex items-center justify-center transition-all hover:shadow-md hover:border-[var(--accent-border)]">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => scroll('der')} disabled={!puedeDer}
              className="w-9 h-9 rounded-full border border-[var(--border)] bg-white hover:bg-[var(--surface-2)] disabled:opacity-30 flex items-center justify-center transition-all hover:shadow-md hover:border-[var(--accent-border)]">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        <div className="relative">
          <div className={`absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none transition-opacity ${puedeIzq ? 'opacity-100' : 'opacity-0'}`} />
          <div className={`absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none transition-opacity ${puedeDer ? 'opacity-100' : 'opacity-0'}`} />
          <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth">
            {productos.map((p, i) => (
              <motion.div key={p._id}
                initial={{ opacity: 0, x: 20 }} animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: Math.min(i * 0.06, 0.4), duration: 0.45 }}
                whileHover={{ y: -6 }}
                className="shrink-0 w-[210px] bg-white border border-[var(--border)] rounded-2xl overflow-hidden cursor-pointer transition-all group hover:shadow-xl hover:shadow-slate-200/80 hover:border-[var(--accent-border)]">
                <Link href={`/store/${p.slugTienda}/product/${p._id}`}>
                  <div className="h-44 bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt={p.title} className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500" />
                      : <div className="w-full h-full flex items-center justify-center"><Package className="w-10 h-10 text-slate-300" /></div>}
                    {p.stock === 0 && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><span className="text-xs font-bold text-slate-500 border border-slate-200 px-3 py-1.5 rounded-full bg-white shadow-sm">Agotado</span></div>}
                    {p.stock > 0 && p.stock <= 5 && <div className="absolute top-2 left-2 text-[10px] bg-red-500 text-white font-bold px-2 py-1 rounded-full shadow-sm">¡Solo {p.stock}!</div>}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md">
                        <ShoppingCart className="w-3.5 h-3.5 text-[var(--accent-dark)]" />
                      </div>
                    </div>
                  </div>
                </Link>
                <div className="p-3.5">
                  <p className="text-[11px] text-[var(--blue)] font-semibold truncate mb-0.5 flex items-center gap-1">
                    <Store className="w-3 h-3 shrink-0" />{p.nombreTienda}
                  </p>
                  <Link href={`/store/${p.slugTienda}/product/${p._id}`}>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] line-clamp-2 leading-snug mb-2 hover:text-[var(--blue)] transition-colors min-h-[2.5rem]">{p.title}</h3>
                  </Link>
                  <div className="flex items-center gap-1 mb-2">
                    {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                    <span className="text-[10px] text-[var(--text-muted)] ml-0.5">(24)</span>
                  </div>
                  <div className="flex items-end justify-between mb-2.5">
                    <div>
                      <p className="text-lg font-black text-[var(--text-primary)]">{fmt(p.price)}</p>
                      <p className="text-[10px] text-green-600 font-semibold flex items-center gap-0.5">
                        <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><path d="M6 1l1.2 2.4L10 4l-2 2 .5 2.8L6 7.5l-2.5 1.3L4 6 2 4l2.8-.6L6 1z" fill="currentColor"/></svg>
                        Envío disponible
                      </p>
                    </div>
                  </div>
                  <motion.button onClick={() => agregar(p)} disabled={p.stock === 0} whileTap={{ scale: 0.96 }}
                    className={`w-full py-2 text-xs font-bold rounded-xl transition-all ${
                      agregadoId === p._id
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-200/60 hover:shadow-lg disabled:opacity-40'
                    }`}>
                    {agregadoId === p._id ? <><CheckCircle className="w-3.5 h-3.5 inline mr-1" />¡Agregado!</> : <><ShoppingCart className="w-3.5 h-3.5 inline mr-1" />Agregar al carrito</>}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CARRUSEL DE TIENDAS
═══════════════════════════════════════════════════════════════════ */
function CarruselTiendas({ tiendas }: { tiendas: TipoTienda[] }) {
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
  if (!tiendas.length) return null;
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
          <div className={`absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-[var(--bg)] to-transparent z-10 pointer-events-none transition-opacity ${puedeIzq ? 'opacity-100' : 'opacity-0'}`} />
          <div className={`absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-[var(--bg)] to-transparent z-10 pointer-events-none transition-opacity ${puedeDer ? 'opacity-100' : 'opacity-0'}`} />
          <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth">
            {tiendas.map((t, i) => (
              <motion.div key={t.id}
                initial={{ opacity: 0, x: 20 }} animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: Math.min(i * 0.06, 0.4), duration: 0.4 }}
                whileHover={{ y: -6 }}
                className="shrink-0 w-[230px] bg-white border border-[var(--border)] rounded-2xl overflow-hidden group transition-all hover:shadow-xl hover:shadow-slate-200/80 hover:border-[var(--accent-border)]">
                <Link href={`/store/${t.slug}`} className="block">
                  <div className="h-28 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, rgba(249,115,22,0.3) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                    {t.logo_url
                      ? <img src={t.logo_url} alt={t.name} className="w-16 h-16 rounded-2xl object-cover shadow-lg z-10" />
                      : <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg z-10">
                          <span className="text-white text-2xl font-black">{t.name[0]?.toUpperCase()}</span>
                        </div>}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 shadow-sm z-10">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-bold text-green-700">Activa</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--blue)] transition-colors mb-0.5">{t.name}</h3>
                    {t.description && <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-2">{t.description}</p>}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[10px] text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-semibold">
                        <BadgeCheck className="w-3 h-3" /> Verificada
                      </span>
                      <span className="text-[11px] text-[var(--blue)] font-semibold group-hover:underline">Ver tienda →</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
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
    <section id="como-funciona" ref={ref} className="py-16 px-4 md:px-6 border-t border-[var(--border)] bg-gradient-to-b from-[var(--surface-2)] to-white">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} className="text-center mb-12">
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
   STATS BAR — con íconos y animación mejorada
═══════════════════════════════════════════════════════════════════ */
const STATS_ICONOS = [
  { svg: <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="2" fill="rgba(255,153,0,0.2)"/><rect x="9" y="12" width="6" height="9" rx="1" stroke="currentColor" strokeWidth="2"/></svg> },
  { svg: <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"><path d="M20 7H4a2 2 0 00-2 2v8a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="2" fill="rgba(255,153,0,0.2)"/><path d="M16 3H8L6 7h12l-2-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg> },
  { svg: <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="rgba(255,153,0,0.2)"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="2"/><path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
  { svg: <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"><path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" stroke="currentColor" strokeWidth="2" fill="rgba(255,153,0,0.2)"/></svg> },
];

function StatsBar({ stats }: { stats: { valor: number; sufijo: string; etiq: string }[] }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <section ref={ref} className="py-12 border-t border-[var(--border)] bg-[var(--nav-bg)] relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,153,0,0.6) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <motion.div key={s.etiq}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="flex flex-col items-center text-center group">
              <motion.div whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-14 h-14 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-2xl flex items-center justify-center mb-3 text-[var(--accent)] transition-all group-hover:bg-[var(--accent)]/20">
                {STATS_ICONOS[i]?.svg}
              </motion.div>
              <div className="text-3xl md:text-4xl font-black text-[var(--accent)] mb-1 tabular-nums">
                <ContadorAnimado objetivo={s.valor} sufijo={s.sufijo} />
              </div>
              <p className="text-xs text-white/50 uppercase tracking-widest font-semibold">{s.etiq}</p>
            </motion.div>
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
                      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, rgba(249,115,22,0.3) 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
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
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <section id="vende" ref={ref} className="py-16 px-4 md:px-6 bg-[var(--nav-bg)] border-t border-[var(--border)] relative overflow-hidden">
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,153,0,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="max-w-3xl mx-auto text-center relative z-10">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <motion.div
            animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-orange-500/40">
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
            ¿Tienes un negocio?<br />
            <span className="text-[var(--accent)]">Véndelo en Shopper.</span>
          </h2>
          <p className="text-white/60 text-base mb-8 max-w-lg mx-auto">Abre tu tienda gratis, llega a miles de compradores y empieza a vender hoy mismo.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/register"
              className="inline-flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold px-8 py-4 rounded-2xl text-base transition-all hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5 active:scale-95">
              <Crown className="w-5 h-5" /> Abrir mi tienda gratis
            </Link>
            <Link href="/auth/login"
              className="inline-flex items-center justify-center gap-2 border border-white/20 text-white hover:bg-white/10 font-medium px-8 py-4 rounded-2xl text-base transition-all">
              Ya tengo cuenta
            </Link>
          </div>
          <p className="text-white/30 text-xs mt-6">Gratis para empezar · Sin tarjeta · Soporte incluido</p>
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
  const [tiendas,    setTiendas]    = useState<TipoTienda[]>([]);
  const [destacados, setDestacados] = useState<ProductoDestacado[]>([]);
  const [cargando,   setCargando]   = useState(true);
  const [statsReales, setStatsReales] = useState<{ tiendas: number; productos: number; compradores: number; satisfaccion: number } | null>(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get('/stores');
        const pub: TipoTienda[] = res.data.filter((t: TipoTienda) => t.is_published);
        setTiendas(pub);
        const prods: ProductoDestacado[] = [];
        await Promise.all(pub.slice(0, 6).map(async (tienda) => {
          try {
            const pr = await api.get(`/stores/${tienda.id}/products`);
            pr.data.filter((p: TipoProducto) => p.is_active !== false).slice(0, 6).forEach((p: TipoProducto) => {
              prods.push({ ...p, nombreTienda: tienda.name, slugTienda: tienda.slug, idTienda: tienda.id });
            });
          } catch { }
        }));
        setDestacados(prods.slice(0, 24));
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
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] overflow-x-hidden">
      <TickerAnuncios />
      <HeroSlider />
      <GridCategorias />
      <CarruselTiendas tiendas={tiendas} />
      <CarruselProductos productos={destacados} />
      <MetodosPago />
      <StatsBar stats={STATS} />
      <ComoFunciona />
      <GridTiendas tiendas={tiendas} cargando={cargando} />
      <BannerVendedores user={user} />
    </div>
  );
}
