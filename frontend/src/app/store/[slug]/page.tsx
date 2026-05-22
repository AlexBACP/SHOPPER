'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, ArrowLeft, Package, Search, Star, ShoppingCart, Share2, CheckCircle, Crown, Tag, BadgeCheck, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Store as TipoTienda } from '@/types';
import { useCartStore } from '@/store/cart.store';

const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

interface Producto { _id: string; title: string; description?: string; price: number; stock: number; images: string[]; sku: string; is_active: boolean; }

export default function PaginaTienda() {
  const { slug } = useParams<{ slug: string }>();
  const [tienda, setTienda] = useState<TipoTienda | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [agregadoId, setAgregadoId] = useState<string | null>(null);
  const [tab, setTab] = useState<'productos' | 'info'>('productos');
  const [compartido, setCompartido] = useState(false);
  const { addItem, openCart } = useCartStore();

  useEffect(() => {
    (async () => {
      try {
        const stores = await api.get('/stores');
        const t = stores.data.find((s: TipoTienda) => s.slug === slug);
        if (!t) { setNotFound(true); return; }
        setTienda(t);
        const pr = await api.get(`/stores/${t.id}/products`);
        setProductos(pr.data.filter((p: Producto) => p.is_active !== false));
      } catch { setNotFound(true); } finally { setLoading(false); }
    })();
  }, [slug]);

  const agregar = (p: Producto) => {
    if (!tienda) return;
    addItem({ productId: p._id, storeId: tienda.id, title: p.title, price: p.price, stock: p.stock, sku: p.sku, image: p.images?.[0] });
    setAgregadoId(p._id); setTimeout(() => setAgregadoId(null), 1800); openCart();
  };

  const compartir = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCompartido(true); setTimeout(() => setCompartido(false), 2000);
  };

  const filtrados = productos.filter(p => p.title.toLowerCase().includes(busqueda.toLowerCase()));

  if (loading) return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Breadcrumb skeleton */}
      <div className="bg-white border-b border-[var(--border)] px-4 py-2">
        <div className="max-w-7xl mx-auto flex gap-2">
          <div className="skeleton h-3 w-16 rounded" />
          <div className="skeleton h-3 w-4 rounded" />
          <div className="skeleton h-3 w-24 rounded" />
        </div>
      </div>
      {/* Header skeleton */}
      <div className="bg-[var(--nav-bg)] px-4 md:px-6 py-10">
        <div className="max-w-7xl mx-auto flex gap-6 items-center">
          <div className="w-20 h-20 rounded-2xl bg-white/10 shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-7 w-48 bg-white/10 rounded-xl" />
            <div className="h-4 w-64 bg-white/10 rounded" />
            <div className="h-3 w-32 bg-white/10 rounded" />
          </div>
        </div>
      </div>
      {/* Grid skeleton */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({length:10}).map((_,i)=><div key={i} className="skeleton h-52 rounded-2xl"/>)}
        </div>
      </div>
    </div>
  );

  if (notFound || !tienda) return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-white border border-[var(--border)] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm"><Store className="w-9 h-9 text-[var(--border-hover)]" /></div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Tienda no encontrada</h1>
        <p className="text-[var(--text-muted)] mb-6 text-sm">Esta tienda no existe o fue eliminada.</p>
        <Link href="/" className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold px-6 py-3 rounded-lg transition-all"><ArrowLeft className="w-4 h-4" /> Volver al inicio</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Link href="/" className="hover:text-[var(--blue)] transition-colors">Inicio</Link>
          <span>/</span>
          <Link href="/#tiendas" className="hover:text-[var(--blue)] transition-colors">Tiendas</Link>
          <span>/</span>
          <span className="text-[var(--text-primary)] font-medium">{tienda.name}</span>
        </div>
      </div>

      {/* Header tienda estilo Amazon storefront */}
      <div className="bg-[var(--nav-bg)]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Logo */}
          <div className="w-20 h-20 rounded-2xl bg-[var(--accent)] flex items-center justify-center shadow-lg shrink-0 overflow-hidden">
            {tienda.logo_url ? <img src={tienda.logo_url} alt={tienda.name} className="w-full h-full object-cover" /> : <span className="text-3xl font-black text-white">{tienda.name[0]?.toUpperCase()}</span>}
          </div>
          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <h1 className="text-2xl font-bold text-white">{tienda.name}</h1>
              <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-300 border border-green-500/30 px-2 py-0.5 rounded-full font-medium"><BadgeCheck className="w-3 h-3" /> Verificada</span>
            </div>
            {tienda.description && <p className="text-white/60 text-sm max-w-lg mb-3">{tienda.description}</p>}
            <div className="flex items-center justify-center sm:justify-start gap-4 text-white/40 text-xs">
              <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" /> {productos.length} productos</span>
              <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-current text-[var(--accent)]" /> Tienda activa</span>
            </div>
          </div>
          {/* Acción */}
          <div className="flex gap-2">
            <button onClick={compartir}
              className="flex items-center gap-2 px-3 py-2 border border-white/20 text-white/70 hover:text-white hover:border-white/40 rounded-lg text-sm transition-all">
              {compartido ? <><CheckCircle className="w-4 h-4 text-green-400" />¡Copiado!</> : <><Share2 className="w-4 h-4" />Copiar link</>}
            </button>
            {tienda && (
              <a href={`https://wa.me/?text=${encodeURIComponent('¡Mira esta tienda en Shopper! ' + tienda.name + ' → ' + (typeof window !== 'undefined' ? window.location.href : ''))}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-all">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.559 4.118 1.535 5.845L.057 23.99l6.345-1.663A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.956 0-3.77-.592-5.27-1.607l-.378-.226-3.916 1.026 1.043-3.82-.247-.393A9.961 9.961 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                WhatsApp
              </a>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex gap-0 border-t border-white/10">
          {[{ id: 'productos', label: `Productos (${productos.length})` }, { id: 'info', label: 'Información' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as 'productos' | 'info')}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-all ${tab === t.id ? 'border-[var(--accent)] text-white' : 'border-transparent text-white/50 hover:text-white/80'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <AnimatePresence mode="wait">
          {tab === 'productos' && (
            <motion.div key="productos" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              {/* Búsqueda */}
              <div className="flex items-center gap-3 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar en esta tienda..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-orange-100 transition-all" />
                </div>
                <span className="text-sm text-[var(--text-muted)]">{filtrados.length} resultados</span>
              </div>

              {filtrados.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <Package className="w-12 h-12 text-[var(--border-hover)] mb-4" />
                  <p className="font-semibold text-[var(--text-secondary)]">{busqueda ? 'Sin resultados' : 'Sin productos aún'}</p>
                  <p className="text-sm text-[var(--text-muted)] mt-1">{busqueda ? 'Intenta con otro término' : 'Esta tienda no tiene productos activos'}</p>
                  {busqueda && <button onClick={() => setBusqueda('')} className="mt-3 text-sm text-[var(--blue)] hover:underline">Limpiar</button>}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  <AnimatePresence mode="popLayout">
                    {filtrados.map((p, i) => (
                      <motion.div key={p._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        transition={{ delay: Math.min(i*0.04,0.3) }} whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(15,17,17,0.14)' }}
                        className="bg-white border border-[var(--border)] rounded-lg overflow-hidden group transition-all">
                        <Link href={`/store/${slug}/product/${p._id}`}>
                          <div className="aspect-square bg-[var(--surface-2)] relative overflow-hidden">
                            {p.images?.[0] ? <img src={p.images[0]} alt={p.title} className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300" />
                              : <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-[var(--border-hover)]" /></div>}
                            {p.stock === 0 && <div className="absolute inset-0 bg-white/70 flex items-center justify-center"><span className="text-xs font-semibold text-[var(--text-muted)] border border-[var(--border)] px-3 py-1 rounded-full bg-white">Agotado</span></div>}
                            {p.stock > 0 && p.stock <= 5 && <div className="absolute top-2 left-2 text-[10px] bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">¡Últimas {p.stock}!</div>}
                          </div>
                        </Link>
                        <div className="p-3">
                          <Link href={`/store/${slug}/product/${p._id}`}>
                            <h3 className="text-sm font-medium text-[var(--text-primary)] line-clamp-2 hover:text-[var(--blue)] transition-colors min-h-[2.5rem]">{p.title}</h3>
                          </Link>
                          <div className="flex items-center gap-0.5 my-1">{[1,2,3,4,5].map(s=><Star key={s} className="w-2.5 h-2.5 fill-orange-400 text-orange-400"/>)}</div>
                          <p className="text-base font-bold text-[var(--text-primary)] mb-2">{fmt(p.price)}</p>
                          <button onClick={() => agregar(p)} disabled={p.stock === 0}
                            className={`w-full py-1.5 text-xs font-bold rounded-lg transition-all ${
                              agregadoId === p._id ? 'bg-green-100 text-green-700' : 'bg-[var(--btn-cart-bg)] hover:bg-[var(--btn-cart-hover)] text-[var(--btn-cart-text)] disabled:opacity-40'
                            }`}>
                            {agregadoId === p._id ? <><CheckCircle className="w-3 h-3 inline mr-1"/>¡Agregado!</> : <><ShoppingCart className="w-3 h-3 inline mr-1"/>Agregar</>}
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {tab === 'info' && (
            <motion.div key="info" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <div className="max-w-2xl bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm">
                <h2 className="font-bold text-lg text-[var(--text-primary)] mb-4">Sobre {tienda.name}</h2>
                <p className="text-[var(--text-secondary)] mb-6">{tienda.description || 'Esta tienda no tiene descripción.'}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-3 p-3 bg-[var(--surface-2)] rounded-lg"><BadgeCheck className="w-5 h-5 text-green-600 shrink-0"/><div><p className="font-medium">Verificada</p><p className="text-xs text-[var(--text-muted)]">Identidad confirmada</p></div></div>
                  <div className="flex items-center gap-3 p-3 bg-[var(--surface-2)] rounded-lg"><Package className="w-5 h-5 text-[var(--accent)] shrink-0"/><div><p className="font-medium">{productos.length} productos</p><p className="text-xs text-[var(--text-muted)]">Disponibles</p></div></div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
