'use client';
import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Package, Store, X, ShoppingCart, CheckCircle,
  Star, Filter, BadgeCheck, ChevronDown, ChevronUp,
  SlidersHorizontal, ArrowUpDown, Heart,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useCartStore } from '@/store/cart.store';
import { useWishlistStore } from '@/store/wishlist.store';

const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

interface StoreData   { id: string; name: string; slug: string; logo_url?: string; is_published: boolean; description?: string; }
interface ProductData { _id: string; store_id: string; title: string; description?: string; price: number; stock: number; images: string[]; sku: string; is_active: boolean; storeName?: string; storeSlug?: string; storeId?: string; }
type SortKey = 'relevance' | 'price_asc' | 'price_desc' | 'name';

const ITEMS_POR_PAGINA = 20;

const SORT_OPTS: { label: string; value: SortKey }[] = [
  { label: 'Relevancia',    value: 'relevance'  },
  { label: 'Precio ↑',     value: 'price_asc'  },
  { label: 'Precio ↓',     value: 'price_desc' },
  { label: 'Nombre A-Z',   value: 'name'       },
];

function SearchContent() {
  const sp     = useSearchParams();
  const router = useRouter();
  const q      = sp.get('q') ?? '';
  const [query,      setQuery]      = useState(q);
  const [stores,     setStores]     = useState<StoreData[]>([]);
  const [products,   setProducts]   = useState<ProductData[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [sortBy,     setSortBy]     = useState<SortKey>('relevance');
  const [showFilters,setShowFilters] = useState(false);
  const [maxPrice,   setMaxPrice]   = useState(10_000_000);
  const [minPrice,   setMinPrice]   = useState(0);
  const [soloStock,  setSoloStock]  = useState(false);
  const [addedId,    setAddedId]    = useState<string | null>(null);
  const [pagina,     setPagina]     = useState(1);
  const [tab,        setTab]        = useState<'all' | 'products' | 'stores'>('all');

  const { addItem, openCart }               = useCartStore();
  const { toggle: wishToggle, has: wishHas } = useWishlistStore();

  const buscar = useCallback(async (busq: string) => {
    if (!busq.trim()) return;
    setLoading(true); setPagina(1);
    try {
      const allStores = await api.get('/stores');
      const pub: StoreData[] = allStores.data.filter((s: StoreData) => s.is_published);
      setStores(pub.filter(s =>
        s.name.toLowerCase().includes(busq.toLowerCase()) ||
        s.description?.toLowerCase().includes(busq.toLowerCase())
      ));
      const allProds: ProductData[] = [];
      await Promise.all(pub.map(async (s) => {
        try {
          const pr = await api.get(`/stores/${s.id}/products`);
          pr.data.filter((p: ProductData) => p.is_active !== false).forEach((p: ProductData) => {
            const hayMatch = p.title.toLowerCase().includes(busq.toLowerCase()) ||
                             p.description?.toLowerCase().includes(busq.toLowerCase());
            if (hayMatch) allProds.push({ ...p, storeName: s.name, storeSlug: s.slug, storeId: s.id });
          });
        } catch {}
      }));
      setProducts(allProds);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { if (q) { setQuery(q); buscar(q); } }, [q]);

  const onSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    buscar(query);
  };

  const agregar = (p: ProductData) => {
    addItem({ productId: p._id, storeId: p.storeId ?? p.store_id, title: p.title, price: p.price, stock: p.stock, sku: p.sku, image: p.images?.[0] });
    setAddedId(p._id); setTimeout(() => setAddedId(null), 1800); openCart();
  };

  // ── Filtrado y ordenamiento ─────────────────────────
  const filtrados = products
    .filter(p => p.price >= minPrice && p.price <= maxPrice)
    .filter(p => !soloStock || p.stock > 0)
    .sort((a, b) => {
      if (sortBy === 'price_asc')  return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'name')       return a.title.localeCompare(b.title);
      return 0;
    });

  // ── Paginación ───────────────────────────────────────
  const totalPags    = Math.ceil(filtrados.length / ITEMS_POR_PAGINA);
  const paginados    = filtrados.slice((pagina - 1) * ITEMS_POR_PAGINA, pagina * ITEMS_POR_PAGINA);
  const totalResultados = filtrados.length + stores.length;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Header búsqueda */}
      <div className="bg-[var(--nav-bg)] px-4 md:px-6 py-8 sticky top-[92px] z-20 shadow-lg">
        <div className="max-w-5xl mx-auto">
          <form onSubmit={onSearch} className="flex gap-3 max-w-2xl">
            <div className="flex-1 flex items-center bg-white rounded-xl overflow-hidden border-2 border-[var(--accent)] shadow-lg shadow-orange-200/20">
              <Search className="w-5 h-5 text-[var(--text-muted)] ml-4 shrink-0" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar productos, tiendas..."
                className="flex-1 px-3 py-3 text-sm text-[var(--text-primary)] outline-none bg-transparent placeholder-[var(--text-muted)]" autoFocus />
              {query && (
                <button type="button" onClick={() => { setQuery(''); setProducts([]); setStores([]); }}
                  className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mr-1">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button type="submit" className="px-6 py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold rounded-xl transition-all hover:shadow-md">
              Buscar
            </button>
          </form>
          {q && !loading && (
            <p className="text-white/60 text-sm mt-3">
              <strong className="text-white">{totalResultados}</strong> resultados para{' '}
              <strong className="text-[var(--accent)]">"{q}"</strong>
            </p>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        {!q && (
          <div className="text-center py-24">
            <div className="w-24 h-24 bg-white border-2 border-dashed border-[var(--border)] rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-[var(--border-hover)]" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">¿Qué estás buscando?</h2>
            <p className="text-[var(--text-muted)]">Escribe un término para buscar productos y tiendas</p>
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            <div className="skeleton h-10 w-48 rounded-xl" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="skeleton h-52 rounded-2xl" />)}
            </div>
          </div>
        )}

        {!loading && q && (
          <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-2 border-b border-[var(--border)] pb-0">
              {[
                { id: 'all',      label: `Todo (${totalResultados})` },
                { id: 'products', label: `Productos (${filtrados.length})` },
                { id: 'stores',   label: `Tiendas (${stores.length})` },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
                  className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all ${
                    tab === t.id
                      ? 'border-[var(--accent)] text-[var(--accent-dark)]'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Controles filtros */}
            {(tab === 'all' || tab === 'products') && products.length > 0 && (
              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={() => setShowFilters(v => !v)}
                  className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl border font-medium transition-all ${
                    showFilters ? 'border-[var(--accent)] bg-orange-50 text-[var(--accent-dark)]' : 'border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
                  }`}>
                  <SlidersHorizontal className="w-4 h-4" />
                  Filtros {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                <select value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)}
                  className="text-sm px-4 py-2 border border-[var(--border)] rounded-xl bg-white outline-none focus:border-[var(--accent)] text-[var(--text-secondary)] cursor-pointer transition-all">
                  {SORT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <span className="text-sm text-[var(--text-muted)] ml-auto hidden sm:block">
                  {filtrados.length} producto{filtrados.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Panel filtros expandido */}
            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="bg-white border border-[var(--border)] rounded-2xl p-5 overflow-hidden shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                        Precio mínimo: <span className="text-[var(--text-primary)]">{fmt(minPrice)}</span>
                      </label>
                      <input type="range" min={0} max={5_000_000} step={10_000} value={minPrice}
                        onChange={e => setMinPrice(Number(e.target.value))}
                        className="w-full accent-[var(--accent)]" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                        Precio máximo: <span className="text-[var(--text-primary)]">{fmt(maxPrice)}</span>
                      </label>
                      <input type="range" min={0} max={10_000_000} step={50_000} value={maxPrice}
                        onChange={e => setMaxPrice(Number(e.target.value))}
                        className="w-full accent-[var(--accent)]" />
                    </div>
                    <div className="flex flex-col justify-end gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={soloStock} onChange={e => setSoloStock(e.target.checked)}
                          className="w-4 h-4 accent-[var(--accent)] rounded" />
                        <span className="text-sm font-medium text-[var(--text-secondary)]">Solo con stock disponible</span>
                      </label>
                      <button onClick={() => { setMinPrice(0); setMaxPrice(10_000_000); setSoloStock(false); }}
                        className="text-xs text-[var(--blue)] hover:underline font-medium text-left">
                        Limpiar filtros
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tiendas */}
            {(tab === 'all' || tab === 'stores') && stores.length > 0 && (
              <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="font-bold text-lg text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <Store className="w-5 h-5 text-[var(--accent)]" /> Tiendas
                </h2>
                <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {stores.map(s => (
                    <motion.div key={s.id} whileHover={{ y: -4 }} className="shrink-0 w-48">
                      <Link href={`/store/${s.slug}`}
                        className="flex flex-col items-center gap-2 bg-white border border-[var(--border)] rounded-2xl p-4 hover:border-[var(--accent-border)] hover:shadow-md transition-all group">
                        <div className="w-14 h-14 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl flex items-center justify-center overflow-hidden border border-[var(--border)]">
                          {s.logo_url ? <img src={s.logo_url} alt={s.name} className="w-full h-full object-cover rounded-xl" />
                            : <span className="text-2xl font-black text-[var(--accent)]">{s.name[0]?.toUpperCase()}</span>}
                        </div>
                        <p className="text-sm font-bold text-[var(--text-primary)] text-center group-hover:text-[var(--accent-dark)] transition-colors truncate max-w-full">{s.name}</p>
                        <span className="flex items-center gap-1 text-[10px] text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-semibold">
                          <BadgeCheck className="w-3 h-3" />Verificada
                        </span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Productos */}
            {(tab === 'all' || tab === 'products') && (
              <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                {products.length > 0 && (
                  <h2 className="font-bold text-lg text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-[var(--accent)]" /> Productos
                  </h2>
                )}
                {paginados.length === 0 && products.length > 0 ? (
                  <div className="text-center py-12">
                    <p className="text-[var(--text-muted)] text-sm">Sin resultados con los filtros actuales</p>
                    <button onClick={() => { setMinPrice(0); setMaxPrice(10_000_000); setSoloStock(false); }}
                      className="mt-3 text-sm text-[var(--blue)] hover:underline">Limpiar filtros</button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      <AnimatePresence mode="popLayout">
                        {paginados.map((p, i) => (
                          <motion.div key={p._id}
                            layout
                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: Math.min(i * 0.03, 0.25) }}
                            whileHover={{ y: -5 }}
                            className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden group hover:shadow-xl hover:shadow-slate-200/80 hover:border-[var(--accent-border)] transition-all relative">
                            {/* Wishlist btn */}
                            <button
                              onClick={() => wishToggle({ productId: p._id, storeId: p.storeId ?? p.store_id, title: p.title, price: p.price, image: p.images?.[0], slug: p._id, storeSlug: p.storeSlug ?? '' })}
                              className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-xl flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ${
                                wishHas(p._id) ? 'bg-rose-100 text-rose-600 opacity-100' : 'bg-white/90 backdrop-blur-sm text-[var(--text-muted)] hover:text-rose-500 shadow-sm'
                              }`}>
                              <Heart className={`w-4 h-4 ${wishHas(p._id) ? 'fill-rose-500' : ''}`} />
                            </button>

                            <Link href={`/store/${p.storeSlug}/product/${p._id}`}>
                              <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
                                {p.images?.[0]
                                  ? <img src={p.images[0]} alt={p.title} className="w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-500" />
                                  : <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-slate-300" /></div>}
                                {p.stock === 0 && (
                                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                    <span className="text-xs font-bold text-[var(--text-muted)] border border-[var(--border)] px-3 py-1.5 rounded-full bg-white shadow-sm">Agotado</span>
                                  </div>
                                )}
                                {p.stock > 0 && p.stock <= 5 && (
                                  <div className="absolute top-2 left-2 text-[10px] bg-red-500 text-white font-bold px-2 py-1 rounded-full shadow-sm">¡Solo {p.stock}!</div>
                                )}
                              </div>
                            </Link>
                            <div className="p-3">
                              <p className="text-[11px] text-[var(--blue)] font-semibold truncate mb-0.5">{p.storeName}</p>
                              <Link href={`/store/${p.storeSlug}/product/${p._id}`}>
                                <h3 className="text-sm font-semibold text-[var(--text-primary)] line-clamp-2 hover:text-[var(--blue)] transition-colors min-h-[2.5rem] leading-snug">{p.title}</h3>
                              </Link>
                              <div className="flex items-center gap-0.5 my-1.5">{[1,2,3,4,5].map(s=><Star key={s} className="w-2.5 h-2.5 fill-amber-400 text-amber-400"/>)}</div>
                              <p className="text-base font-black text-[var(--text-primary)] mb-2.5">{fmt(p.price)}</p>
                              <motion.button onClick={() => agregar(p)} disabled={p.stock === 0} whileTap={{ scale: 0.96 }}
                                className={`w-full py-2 text-xs font-bold rounded-xl transition-all ${
                                  addedId === p._id
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-200/60 disabled:opacity-40'
                                }`}>
                                {addedId === p._id
                                  ? <><CheckCircle className="w-3.5 h-3.5 inline mr-1"/>¡Agregado!</>
                                  : <><ShoppingCart className="w-3.5 h-3.5 inline mr-1"/>Agregar</>}
                              </motion.button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    {/* Paginación */}
                    {totalPags > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-8">
                        <button onClick={() => { setPagina(p => Math.max(1, p - 1)); window.scrollTo({ top: 300, behavior: 'smooth' }); }}
                          disabled={pagina === 1}
                          className="px-4 py-2 text-sm border border-[var(--border)] rounded-xl bg-white disabled:opacity-40 hover:bg-[var(--surface-2)] transition-all font-medium">
                          ← Anterior
                        </button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(totalPags, 7) }, (_, i) => {
                            let pg = i + 1;
                            if (totalPags > 7) {
                              if (pagina <= 4)        pg = i + 1;
                              else if (pagina >= totalPags - 3) pg = totalPags - 6 + i;
                              else pg = pagina - 3 + i;
                            }
                            return (
                              <button key={pg} onClick={() => { setPagina(pg); window.scrollTo({ top: 300, behavior: 'smooth' }); }}
                                className={`w-9 h-9 text-sm rounded-xl font-medium transition-all ${
                                  pagina === pg ? 'bg-[var(--accent)] text-white shadow-md shadow-orange-200/60' : 'border border-[var(--border)] bg-white hover:bg-[var(--surface-2)] text-[var(--text-secondary)]'
                                }`}>
                                {pg}
                              </button>
                            );
                          })}
                        </div>
                        <button onClick={() => { setPagina(p => Math.min(totalPags, p + 1)); window.scrollTo({ top: 300, behavior: 'smooth' }); }}
                          disabled={pagina === totalPags}
                          className="px-4 py-2 text-sm border border-[var(--border)] rounded-xl bg-white disabled:opacity-40 hover:bg-[var(--surface-2)] transition-all font-medium">
                          Siguiente →
                        </button>
                      </div>
                    )}
                    {totalPags > 1 && (
                      <p className="text-center text-xs text-[var(--text-muted)] mt-2">
                        Página {pagina} de {totalPags} · {filtrados.length} productos
                      </p>
                    )}
                  </>
                )}
              </motion.section>
            )}

            {/* Sin resultados */}
            {filtrados.length === 0 && stores.length === 0 && (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-white border-2 border-dashed border-[var(--border)] rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-9 h-9 text-[var(--border-hover)]" />
                </div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Sin resultados para "{q}"</h2>
                <p className="text-[var(--text-muted)] mb-6 text-sm">Intenta con otro término o explora nuestras tiendas</p>
                <Link href="/" className="inline-flex items-center gap-2 bg-[var(--btn-cart-bg)] hover:bg-[var(--btn-cart-hover)] text-[var(--btn-cart-text)] font-bold px-6 py-3 rounded-xl transition-all hover:shadow-md text-sm">
                  Explorar tiendas
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return <Suspense><SearchContent /></Suspense>;
}
