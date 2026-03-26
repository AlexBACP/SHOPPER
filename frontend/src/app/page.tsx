'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Search, ShoppingBag, Store, ArrowRight, Sparkles,
  ChevronLeft, ChevronRight, Package, Users, TrendingUp,
  Shield, Zap, Globe, Star, CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { Store as StoreType } from '@/types';

// Componente contador animado
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function HomePage() {
  const [stores, setStores] = useState<StoreType[]>([]);
  const [filtered, setFiltered] = useState<StoreType[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    api.get('/stores')
      .then((res) => {
        const published = res.data.filter((s: StoreType) => s.is_published);
        setStores(published);
        setFiltered(published);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(stores.filter(
      (s) => s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q),
    ));
  }, [search, stores]);

  // Carrusel automático
  useEffect(() => {
    if (stores.length === 0) return;
    carouselRef.current = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % Math.max(1, stores.length));
    }, 3500);
    return () => { if (carouselRef.current) clearInterval(carouselRef.current); };
  }, [stores]);

  const prevSlide = () => {
    if (carouselRef.current) clearInterval(carouselRef.current);
    setCarouselIndex((prev) => (prev - 1 + stores.length) % Math.max(1, stores.length));
  };

  const nextSlide = () => {
    if (carouselRef.current) clearInterval(carouselRef.current);
    setCarouselIndex((prev) => (prev + 1) % Math.max(1, stores.length));
  };

  const featuredStore = stores[carouselIndex];

  const steps = [
    { icon: Store, title: 'Explora tiendas', desc: 'Descubre cientos de tiendas independientes con productos únicos y auténticos.' },
    { icon: ShoppingBag, title: 'Agrega al carrito', desc: 'Compra de múltiples tiendas en una sola experiencia de compra unificada.' },
    { icon: CheckCircle, title: 'Pago seguro', desc: 'Un solo checkout, pagos procesados de forma segura con encriptación total.' },
  ];

  const features = [
    { icon: Shield, title: 'Pagos seguros', desc: 'Todos los pagos están protegidos y encriptados.' },
    { icon: Zap, title: 'Ultra rápido', desc: 'Experiencia de compra fluida y sin fricciones.' },
    { icon: Globe, title: 'Multi-tienda', desc: 'Compra de varios vendedores en un solo pedido.' },
    { icon: Star, title: 'Calidad garantizada', desc: 'Vendedores verificados y productos de calidad.' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1a1a1a] bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Shopper</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
            <a href="#tiendas" className="hover:text-white transition-colors">Tiendas</a>
            <a href="#como-funciona" className="hover:text-white transition-colors">Cómo funciona</a>
            <a href="#vender" className="hover:text-white transition-colors">Vender aquí</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block">
              Iniciar sesión
            </Link>
            <Link href="/auth/register" className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-indigo-500/20">
              Registrarse
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-indigo-600/8 rounded-full blur-3xl" />
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-purple-600/8 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-72 h-72 bg-blue-600/8 rounded-full blur-3xl" />
          {/* Grid decorativo */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 text-sm px-4 py-1.5 rounded-full mb-8"
          >
            <Sparkles className="w-3.5 h-3.5" />
            El marketplace más moderno de la región
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold leading-tight mb-6 tracking-tight"
          >
            Descubre. Compra.
            <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mt-2">
              Conecta con vendedores.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Explora tiendas independientes, encuentra productos únicos y apoya
            a vendedores locales — todo en un solo lugar con un checkout unificado.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
          >

            <a href="#tiendas"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
            >
              <Store className="w-4 h-4" />
              <span>Explorar tiendas</span>
            </a>
            <Link
              href="/auth/register"
              className="flex items-center gap-2 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] hover:border-[#333] text-zinc-300 px-8 py-3.5 rounded-xl font-medium transition-all hover:-translate-y-0.5"
            >
              <span>Vender aquí</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-3 gap-6 max-w-lg mx-auto"
          >
            {[
              { value: stores.length || 50, suffix: '+', label: 'Tiendas activas' },
              { value: 1200, suffix: '+', label: 'Productos' },
              { value: 98, suffix: '%', label: 'Satisfacción' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-bold text-white">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-xs text-zinc-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section >

      {/* ── CARRUSEL ── */}
      {
        stores.length > 0 && (
          <section className="px-6 pb-20">
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex items-center justify-between mb-6"
              >
                <div>
                  <h2 className="text-2xl font-bold">Tiendas destacadas</h2>
                  <p className="text-zinc-500 text-sm mt-1">Las más populares del momento</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevSlide}
                    className="w-9 h-9 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] rounded-xl flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="w-9 h-9 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] rounded-xl flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>

              <AnimatePresence mode="wait">
                {featuredStore && (
                  <motion.div
                    key={featuredStore.id}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Link href={`/store/${featuredStore.slug}`}>
                      <div className="relative h-64 md:h-80 bg-gradient-to-br from-indigo-600/20 via-purple-600/15 to-pink-600/10 rounded-3xl border border-indigo-500/10 overflow-hidden cursor-pointer group">
                        {/* Fondo decorativo */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
                        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />

                        <div className="relative z-10 h-full flex items-center px-10 md:px-16">
                          <div className="flex items-center gap-8">
                            {/* Logo */}
                            <div className="w-20 h-20 md:w-28 md:h-28 bg-[#111]/80 rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl shrink-0">
                              {featuredStore.logo_url ? (
                                <img src={featuredStore.logo_url} alt={featuredStore.name} className="w-full h-full rounded-2xl object-cover" />
                              ) : (
                                <Store className="w-10 h-10 md:w-14 md:h-14 text-indigo-400" />
                              )}
                            </div>
                            {/* Info */}
                            <div>
                              <span className="text-xs text-indigo-400 bg-indigo-600/10 border border-indigo-500/20 px-3 py-1 rounded-full mb-3 inline-block">
                                Tienda destacada
                              </span>
                              <h3 className="text-3xl md:text-4xl font-bold text-white mb-2">
                                {featuredStore.name}
                              </h3>
                              {featuredStore.description && (
                                <p className="text-zinc-400 text-sm md:text-base max-w-md line-clamp-2">
                                  {featuredStore.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-4 text-indigo-400 text-sm font-medium group-hover:gap-3 transition-all">
                                Ver tienda <ArrowRight className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Dots indicadores */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {stores.map((_, i) => (
                            <button
                              key={i}
                              onClick={(e) => { e.preventDefault(); setCarouselIndex(i); }}
                              className={`h-1.5 rounded-full transition-all ${i === carouselIndex ? 'bg-indigo-400 w-6' : 'bg-zinc-600 w-1.5'
                                }`}
                            />
                          ))}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        )
      }

      {/* ── CÓMO FUNCIONA ── */}
      <section id="como-funciona" className="px-6 py-20 border-t border-[#111]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="text-xs text-indigo-400 bg-indigo-600/10 border border-indigo-500/20 px-3 py-1 rounded-full mb-4 inline-block">
              Simple y rápido
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">¿Cómo funciona?</h2>
            <p className="text-zinc-500 max-w-xl mx-auto">
              Comprar en Shopper es tan fácil como 1, 2, 3. Sin complicaciones, sin filas.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Línea conectora */}
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-6 text-center relative"
              >
                <div className="w-14 h-14 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-7 h-7 text-indigo-400" />
                </div>
                <div className="absolute top-4 right-4 text-4xl font-bold text-[#1a1a1a]">
                  0{i + 1}
                </div>
                <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ANIMADAS ── */}
      <section className="px-6 py-20 bg-gradient-to-b from-transparent via-indigo-600/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Store, value: stores.length || 50, suffix: '+', label: 'Tiendas activas', color: 'text-indigo-400' },
              { icon: Package, value: 1200, suffix: '+', label: 'Productos disponibles', color: 'text-purple-400' },
              { icon: Users, value: 850, suffix: '+', label: 'Compradores felices', color: 'text-pink-400' },
              { icon: TrendingUp, value: 98, suffix: '%', label: 'Satisfacción del cliente', color: 'text-emerald-400' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#111] border border-[#1a1a1a] rounded-2xl p-6 text-center"
              >
                <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-3`} />
                <div className={`text-3xl font-bold ${stat.color} mb-1`}>
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-xs text-zinc-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="px-6 py-20 border-t border-[#111]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">¿Por qué Shopper?</h2>
            <p className="text-zinc-500 max-w-xl mx-auto">
              Construido para compradores modernos que valoran la seguridad, velocidad y variedad.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="bg-[#111] border border-[#1a1a1a] hover:border-indigo-500/20 rounded-2xl p-5 transition-all"
              >
                <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center mb-3">
                  <f.icon className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-zinc-500 text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GRID DE TIENDAS ── */}
      <section id="tiendas" className="px-6 py-20 border-t border-[#111]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
          >
            <div>
              <h2 className="text-2xl font-bold">Todas las tiendas</h2>
              <p className="text-zinc-500 text-sm mt-1">{filtered.length} tiendas disponibles</p>
            </div>
            {/* Búsqueda */}
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar tiendas..."
                className="w-full pl-11 pr-4 py-2.5 bg-[#111] border border-[#222] hover:border-[#333] focus:border-indigo-500 rounded-xl text-white placeholder-zinc-500 text-sm outline-none transition-all"
              />
            </div>
          </motion.div>

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-[#111] border border-[#1a1a1a] rounded-2xl h-56 animate-pulse" />
              ))}
            </div>
          )}

          {/* Sin resultados */}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Store className="w-12 h-12 text-zinc-600 mb-4" />
              <h3 className="text-lg font-medium text-zinc-400 mb-2">No se encontraron tiendas</h3>
              <p className="text-zinc-600 text-sm">Intenta con otro término</p>
            </div>
          )}

          {/* Cards */}
          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              <AnimatePresence mode="popLayout">
                {filtered.map((store, i) => (
                  <motion.div
                    key={store.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ y: -4 }}
                  >
                    <Link href={`/store/${store.slug}`}>
                      <div className="group bg-[#111] border border-[#1a1a1a] hover:border-indigo-500/30 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer h-full">
                        <div className="h-32 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-pink-600/10 relative flex items-center justify-center">
                          {store.logo_url ? (
                            <img src={store.logo_url} alt={store.name} className="w-16 h-16 rounded-xl object-cover shadow-lg" />
                          ) : (
                            <div className="w-16 h-16 bg-indigo-600/30 rounded-xl flex items-center justify-center border border-indigo-500/20">
                              <Store className="w-8 h-8 text-indigo-400" />
                            </div>
                          )}
                          <div className="absolute top-3 right-3 w-2 h-2 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50" />
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
                                {store.name}
                              </h3>
                              {store.description && (
                                <p className="text-zinc-500 text-xs mt-1 line-clamp-2">{store.description}</p>
                              )}
                            </div>
                            <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all shrink-0 ml-2 mt-0.5" />
                          </div>
                          <div className="mt-3 pt-3 border-t border-[#1a1a1a]">
                            <span className="text-xs text-zinc-600 font-mono">/{store.slug}</span>
                          </div>
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

      {/* ── BANNER CTA VENDEDOR ── */}
      <section id="vender" className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-pink-600/10 border border-indigo-500/20 rounded-3xl p-10 md:p-16 text-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-indigo-600/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <span className="text-xs text-indigo-400 bg-indigo-600/10 border border-indigo-500/20 px-3 py-1 rounded-full mb-6 inline-block">
                Para vendedores
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                ¿Tienes algo que vender?
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-8">
                Abre tu tienda en Shopper y llega a miles de compradores.
                Sin comisiones abusivas, sin complicaciones técnicas.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/auth/register"
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5"
                >
                  <Store className="w-4 h-4" />
                  Abrir mi tienda gratis
                </Link>
                <Link
                  href="/auth/login"
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Ya tengo cuenta →
                </Link>
              </div>
              <div className="flex items-center justify-center gap-6 mt-8 text-xs text-zinc-500">
                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Gratis para empezar</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Sin tarjeta requerida</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Soporte incluido</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#1a1a1a] py-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold">Shopper</span>
              <span className="text-zinc-600 text-sm ml-2">El marketplace de los independientes</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <a href="#tiendas" className="hover:text-white transition-colors">Tiendas</a>
              <a href="#como-funciona" className="hover:text-white transition-colors">Cómo funciona</a>
              <Link href="/auth/register" className="hover:text-white transition-colors">Registrarse</Link>
              <Link href="/auth/login" className="hover:text-white transition-colors">Iniciar sesión</Link>
            </div>
          </div>
          <div className="border-t border-[#1a1a1a] mt-8 pt-8 text-center text-xs text-zinc-600">
            © 2026 Shopper. Todos los derechos reservados. Hecho con dedicación para vendedores independientes.
          </div>
        </div>
      </footer>
    </div >
  );
}