'use client';
import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Package, Store, X, ShoppingCart, CheckCircle, Heart, ShieldCheck,
  Laptop, Shirt, Home as HomeIcon, Palette, Utensils, Dumbbell, Sparkles, Baby,
  Plus, SlidersHorizontal, ChevronLeft, ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useCartStore } from '@/store/cart.store';
import { useWishlistStore } from '@/store/wishlist.store';
import StoreCard from '@/components/store/StoreCard';
import { getProductImageByTitle, getLocalImageByTitle } from '@/data/productImages';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

interface StoreData   { id: string; name: string; slug: string; logo_url?: string; is_published: boolean; description?: string; }
interface ProductData { _id: string; store_id: string; title: string; description?: string; category?: string; price: number; stock: number; images: string[]; sku: string; is_active: boolean; storeName?: string; storeSlug?: string; storeId?: string; compare_at_price?: number; }
type SortKey = 'relevance' | 'price_asc' | 'price_desc' | 'name';

const CATEGORIAS: { slug: string; label: string; Icon: LucideIcon }[] = [
  { slug: 'tecnologia', label: 'Tecnología',  Icon: Laptop   },
  { slug: 'moda',       label: 'Moda y Ropa', Icon: Shirt    },
  { slug: 'hogar',      label: 'Hogar y Deco',Icon: HomeIcon },
  { slug: 'artesanias', label: 'Artesanías',  Icon: Palette  },
  { slug: 'alimentos',  label: 'Alimentos',   Icon: Utensils },
  { slug: 'deportes',   label: 'Deportes',    Icon: Dumbbell },
  { slug: 'belleza',    label: 'Belleza',     Icon: Sparkles },
  { slug: 'ninos',      label: 'Niños',       Icon: Baby     },
];

const ITEMS_POR_PAGINA = 20;
const SORT_OPTS: { label: string; value: SortKey }[] = [
  { label: 'Relevancia',  value: 'relevance'  },
  { label: 'Precio ↑',    value: 'price_asc'  },
  { label: 'Precio ↓',    value: 'price_desc' },
  { label: 'Nombre A-Z',  value: 'name'       },
];

function SearchContent() {
  const sp     = useSearchParams();
  const router = useRouter();
  const q          = sp.get('q')        ?? '';
  const catParam   = sp.get('category') ?? sp.get('categoria') ?? '';

  const [query,      setQuery]      = useState(q);
  const [categoria,  setCategoria]  = useState(catParam);
  const [stores,     setStores]     = useState<StoreData[]>([]);
  const [products,   setProducts]   = useState<ProductData[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [sortBy,     setSortBy]     = useState<SortKey>('relevance');
  const [maxPrice,   setMaxPrice]   = useState(10_000_000);
  const [minPrice,   setMinPrice]   = useState(0);
  const [soloStock,  setSoloStock]  = useState(false);
  const [addedId,    setAddedId]    = useState<string | null>(null);
  const [pagina,     setPagina]     = useState(1);
  const [tab,        setTab]        = useState<'all' | 'products' | 'stores'>('all');
  const [mFilters,   setMFilters]   = useState(false); // mobile drawer

  const { addItem, openCart }                = useCartStore();
  const { toggle: wishToggle, has: wishHas } = useWishlistStore();

  const buscar = useCallback(async (busq: string, cat: string) => {
    const hayBusqueda = busq.trim() || cat;
    if (!hayBusqueda) return;
    setLoading(true); setPagina(1);
    try {
      const params: Record<string, string> = { limit: '100', skip: '0' };
      if (busq.trim()) params.q        = busq.trim();
      if (cat)         params.category = cat;

      const [searchRes, storesRes] = await Promise.all([
        api.get('/products/search', { params }),
        api.get('/stores'),
      ]);

      const resultados: ProductData[] = (searchRes.data.resultados ?? []).map((p: any) => ({
        ...p,
        storeId: p.store_id,
      }));
      setProducts(resultados);

      const pub: StoreData[] = storesRes.data.filter((s: StoreData) => s.is_published);
      setStores(busq.trim()
        ? pub.filter(s =>
            s.name.toLowerCase().includes(busq.toLowerCase()) ||
            s.description?.toLowerCase().includes(busq.toLowerCase()),
          )
        : [],
      );
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    setQuery(q);
    setCategoria(catParam);
    if (q || catParam) buscar(q, catParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, catParam]);

  const onSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() && !categoria) return;
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (categoria)    params.set('category', categoria);
    router.push(`/search?${params.toString()}`);
    buscar(query, categoria);
  };

  const cambiarCategoria = (slug: string) => {
    const nueva = categoria === slug ? '' : slug;
    setCategoria(nueva);
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (nueva)        params.set('category', nueva);
    router.push(`/search?${params.toString()}`);
    buscar(query, nueva);
  };

  const limpiarFiltros = () => {
    setMinPrice(0);
    setMaxPrice(10_000_000);
    setSoloStock(false);
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

  const totalPags    = Math.ceil(filtrados.length / ITEMS_POR_PAGINA);
  const paginados    = filtrados.slice((pagina - 1) * ITEMS_POR_PAGINA, pagina * ITEMS_POR_PAGINA);
  const totalResultados = filtrados.length + stores.length;
  const catLabel = catParam ? (CATEGORIAS.find(c => c.slug === catParam)?.label ?? catParam) : '';

  return (
    <div className="min-h-screen" style={{ background: 'var(--bone)' }}>
      {/* ── Masthead editorial ── */}
      <div className="edsr-mast">
        <div className="edsr-mast-inner">
          <form onSubmit={onSearch} className="edsr-form">
            <div className="edsr-input-wrap">
              <Search className="w-5 h-5 lead" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar productos, tiendas, materiales..."
                autoFocus
                aria-label="Buscar"
              />
              {query && (
                <button type="button" className="clear" onClick={() => { setQuery(''); setProducts([]); setStores([]); }} aria-label="Limpiar">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button type="submit" className="submit">Buscar</button>
          </form>

          {(q || catParam) && !loading && (
            <div className="edsr-summary">
              <strong>{totalResultados}</strong>
              resultado{totalResultados !== 1 ? 's' : ''}
              {q && <> para <span className="term">"{q}"</span></>}
              {catParam && <> en <span className="term">{catLabel}</span></>}
            </div>
          )}
        </div>
      </div>

      <div className="edsr-wrap">

        {/* Estado inicial — sin búsqueda */}
        {!q && !catParam && (
          <div className="edsr-empty" style={{ paddingTop: 120 }}>
            <div className="edsr-empty-icon"><Search className="w-9 h-9" /></div>
            <h2>¿Qué estás <span className="it">buscando</span>?</h2>
            <p>Escribe un término o explora el índice por categoría desde el inicio.</p>
            <Link href="/#categorias" className="btn btn-primary">Ver índice</Link>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="edsr-grid">
            <div className="edsr-side"><div className="skeleton h-80 rounded-xl" /></div>
            <div>
              <div className="skeleton h-10 w-64 rounded-full mb-6" />
              <div className="edsr-pgrid">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ aspectRatio: '1/1.18', borderRadius: 'var(--r-md)' }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Contenido con resultados */}
        {!loading && (q || catParam) && (
          <div className="edsr-grid">
            {/* —— SIDEBAR FILTROS —— */}
            <aside className={'edsr-side' + (mFilters ? '' : ' collapsed')} aria-label="Filtros">
              <div className="edsr-side-h">
                <span>Filtros</span>
                <button type="button" className="clear-all" onClick={limpiarFiltros}>Limpiar</button>
              </div>

              {/* Categorías */}
              <div className="edsr-side-block">
                <div className="lbl">Categoría</div>
                <div className="edsr-cat-list">
                  {CATEGORIAS.map(cat => {
                    const Ic = cat.Icon;
                    const active = categoria === cat.slug;
                    return (
                      <button
                        type="button"
                        key={cat.slug}
                        className="edsr-cat-item"
                        aria-pressed={active}
                        onClick={() => cambiarCategoria(cat.slug)}
                      >
                        <Ic className="w-4 h-4" />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rango de precio */}
              <div className="edsr-side-block">
                <div className="lbl">Precio mínimo · <span className="val">{fmt(minPrice)}</span></div>
                <input
                  type="range"
                  min={0} max={5_000_000} step={10_000}
                  value={minPrice}
                  onChange={e => setMinPrice(Number(e.target.value))}
                  className="edsr-range"
                  aria-label="Precio mínimo"
                />
              </div>

              <div className="edsr-side-block">
                <div className="lbl">Precio máximo · <span className="val">{fmt(maxPrice)}</span></div>
                <input
                  type="range"
                  min={0} max={10_000_000} step={50_000}
                  value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className="edsr-range"
                  aria-label="Precio máximo"
                />
              </div>

              <div className="edsr-side-block">
                <label className="edsr-check">
                  <input
                    type="checkbox"
                    checked={soloStock}
                    onChange={e => setSoloStock(e.target.checked)}
                  />
                  Solo con stock
                </label>
              </div>
            </aside>

            {/* —— MAIN —— */}
            <main>
              {/* Toolbar superior */}
              <div className="edsr-toolbar">
                <div className="edsr-tabs" role="tablist" aria-label="Tipo de resultado">
                  {[
                    { id: 'all',      label: 'Todo',      ct: totalResultados   },
                    { id: 'products', label: 'Productos', ct: filtrados.length  },
                    { id: 'stores',   label: 'Tiendas',   ct: stores.length     },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      aria-pressed={tab === t.id}
                      onClick={() => setTab(t.id as typeof tab)}
                    >
                      {t.label}<span className="ct">{t.ct}</span>
                    </button>
                  ))}
                </div>

                <div className="edsr-sort">
                  <button
                    type="button"
                    className="edsr-filters-btn"
                    onClick={() => setMFilters(v => !v)}
                    aria-expanded={mFilters}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    {mFilters ? 'Ocultar' : 'Filtros'}
                  </button>
                  <span className="lbl hidden sm:inline">Orden</span>
                  <select
                    className="edsr-select"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as SortKey)}
                    aria-label="Ordenar resultados"
                  >
                    {SORT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Tiendas */}
              {(tab === 'all' || tab === 'stores') && stores.length > 0 && (
                <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="edsr-stores-h">
                    <Store className="w-4 h-4" />
                    <span>Tiendas</span>
                    <span className="it">— {stores.length}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                    {stores.map(s => (
                      <StoreCard
                        key={s.id}
                        store={s}
                        productCount={products.filter(p => (p.storeId ?? p.store_id) === s.id).length || undefined}
                      />
                    ))}
                  </div>
                </motion.section>
              )}

              {/* Productos */}
              {(tab === 'all' || tab === 'products') && (
                <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                  {products.length > 0 && (
                    <div className="edsr-stores-h">
                      <Package className="w-4 h-4" />
                      <span>Productos</span>
                      <span className="it">— {filtrados.length}</span>
                    </div>
                  )}

                  {paginados.length === 0 && products.length > 0 ? (
                    <div className="edsr-empty">
                      <div className="edsr-empty-icon"><SlidersHorizontal className="w-9 h-9" /></div>
                      <h2>Sin <span className="it">resultados</span> con los filtros</h2>
                      <p>Ajusta el rango de precio o quita el filtro de stock para ver más.</p>
                      <button type="button" className="btn btn-ghost" onClick={limpiarFiltros}>
                        Limpiar filtros
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="edsr-pgrid">
                        <AnimatePresence mode="popLayout">
                          {paginados.map((p, i) => {
                            const isWished = wishHas(p._id);
                            const lowStock = p.stock > 0 && p.stock <= 5;
                            const productHref = `/store/${p.storeSlug}/product/${p._id}`;
                            const desc = p.compare_at_price && p.compare_at_price > p.price
                              ? Math.round((1 - p.price / p.compare_at_price) * 100) : 0;
                            return (
                              <motion.article
                                key={p._id}
                                layout
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.96 }}
                                transition={{ delay: Math.min(i * 0.025, 0.2), duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
                                className="pcard"
                              >
                                <div className="pcard-img">
                                  <Link href={productHref} className="absolute inset-0 block">
                                    <img
                                      src={getLocalImageByTitle(p.title) || p.images?.[0] || getProductImageByTitle(p.title, p.category)}
                                      alt={p.title}
                                      loading="lazy"
                                    />
                                  </Link>

                                  {desc > 0 && <span className="pcard-tag tag-sale">−{desc}%</span>}
                                  {lowStock && <span className="pcard-low">Solo {p.stock}</span>}

                                  <button
                                    type="button"
                                    className={'pcard-fav' + (isWished ? ' on' : '')}
                                    aria-label={isWished ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                                    onClick={() =>
                                      wishToggle({
                                        productId: p._id,
                                        storeId: p.storeId ?? p.store_id,
                                        title: p.title,
                                        price: p.price,
                                        image: p.images?.[0],
                                        slug: p._id,
                                        storeSlug: p.storeSlug ?? '',
                                      })
                                    }
                                  >
                                    <Heart
                                      className="w-[18px] h-[18px]"
                                      style={{
                                        fill: isWished ? 'var(--primary)' : 'none',
                                        color: isWished ? 'var(--primary)' : 'var(--ink)',
                                      }}
                                    />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => agregar(p)}
                                    disabled={p.stock === 0}
                                    className={'pcard-add' + (addedId === p._id ? ' done' : '')}
                                    aria-label="Agregar al carrito"
                                  >
                                    {addedId === p._id
                                      ? <><CheckCircle className="w-4 h-4" /> Agregado</>
                                      : <><Plus className="w-4 h-4" /> Agregar</>}
                                  </button>

                                  {p.stock === 0 && (
                                    <div className="pcard-soldout"><span>Agotado</span></div>
                                  )}
                                </div>

                                <div className="pcard-body">
                                  <span className="pcard-store">
                                    <ShieldCheck className="w-3 h-3" /> {p.storeName ?? 'Tienda'}
                                  </span>
                                  <h3 className="pcard-name">
                                    <Link href={productHref}>{p.title}</Link>
                                  </h3>
                                  <div className="pcard-price">
                                    <strong>{fmt(p.price)}</strong>
                                    {p.compare_at_price ? <s>{fmt(p.compare_at_price)}</s> : null}
                                  </div>
                                </div>
                              </motion.article>
                            );
                          })}
                        </AnimatePresence>
                      </div>

                      {/* Paginación editorial */}
                      {totalPags > 1 && (
                        <nav className="edsr-pager" aria-label="Paginación">
                          <div className="edsr-pager-row">
                            <button
                              type="button"
                              className="edsr-pager-btn"
                              disabled={pagina === 1}
                              onClick={() => { setPagina(p => Math.max(1, p - 1)); window.scrollTo({ top: 280, behavior: 'smooth' }); }}
                              aria-label="Página anterior"
                            >
                              <ChevronLeft className="w-4 h-4" /> Anterior
                            </button>

                            {Array.from({ length: Math.min(totalPags, 7) }, (_, i) => {
                              let pg = i + 1;
                              if (totalPags > 7) {
                                if (pagina <= 4)                    pg = i + 1;
                                else if (pagina >= totalPags - 3)   pg = totalPags - 6 + i;
                                else                                pg = pagina - 3 + i;
                              }
                              return (
                                <button
                                  key={pg}
                                  type="button"
                                  className="edsr-pager-btn"
                                  aria-current={pagina === pg}
                                  onClick={() => { setPagina(pg); window.scrollTo({ top: 280, behavior: 'smooth' }); }}
                                >
                                  {String(pg).padStart(2, '0')}
                                </button>
                              );
                            })}

                            <button
                              type="button"
                              className="edsr-pager-btn"
                              disabled={pagina === totalPags}
                              onClick={() => { setPagina(p => Math.min(totalPags, p + 1)); window.scrollTo({ top: 280, behavior: 'smooth' }); }}
                              aria-label="Página siguiente"
                            >
                              Siguiente <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="edsr-pager-info">
                            Pág. {String(pagina).padStart(2, '0')} de {String(totalPags).padStart(2, '0')} · {filtrados.length} productos
                          </p>
                        </nav>
                      )}
                    </>
                  )}
                </motion.section>
              )}

              {/* Sin resultados global */}
              {filtrados.length === 0 && stores.length === 0 && (
                <div className="edsr-empty">
                  <div className="edsr-empty-icon"><Search className="w-9 h-9" /></div>
                  <h2>Sin <span className="it">resultados</span></h2>
                  <p>
                    Intenta con otro término o explora todas las tiendas desde la edición principal.
                  </p>
                  <Link href="/" className="btn btn-primary">Volver al inicio</Link>
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return <Suspense><SearchContent /></Suspense>;
}
