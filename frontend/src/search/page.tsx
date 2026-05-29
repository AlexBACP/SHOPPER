'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Package, Store, X, SlidersHorizontal,
  ShoppingCart, CheckCircle, ArrowUpDown,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useCartStore } from '@/store/cart.store';
import { SkeletonCard } from '@/components/ui/Skeletons';

interface StoreData {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  is_published: boolean;
}

interface Product {
  _id: string;
  store_id: string;
  title: string;
  description?: string;
  price: number;
  stock: number;
  images: string[];
  sku: string;
  is_active: boolean;
  // inyectado en cliente
  storeName?: string;
  storeSlug?: string;
}

type SortKey = 'relevance' | 'price_asc' | 'price_desc' | 'name';

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: 'Relevancia',     value: 'relevance'  },
  { label: 'Precio: menor',  value: 'price_asc'  },
  { label: 'Precio: mayor',  value: 'price_desc' },
  { label: 'Nombre A-Z',     value: 'name'       },
];

// ── Inner (necesita useSearchParams) ─────────────────────
function SearchContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const qParam       = searchParams.get('q') ?? '';

  const [query, setQuery]         = useState(qParam);
  const [inputVal, setInputVal]   = useState(qParam);
  const [stores, setStores]       = useState<StoreData[]>([]);
  const [allProducts, setAll]     = useState<Product[]>([]);
  const [loading, setLoading]     = useState(false);
  const [sort, setSort]           = useState<SortKey>('relevance');
  const [maxPrice, setMaxPrice]   = useState<number | ''>('');
  const [storeFilter, setStoreFilter] = useState<string>('');
  const [addedId, setAddedId]     = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { addItem, openCart } = useCartStore();

  // 1. Cargar tiendas una sola vez
  useEffect(() => {
    api.get('/stores')
      .then((r) => setStores(r.data.filter((s: StoreData) => s.is_published)))
      .catch(() => {});
  }, []);

  // 2. Cargar productos de todas las tiendas cuando hay query
  useEffect(() => {
    if (!query.trim() || stores.length === 0) {
      setAll([]);
      return;
    }
    setLoading(true);

    Promise.all(
      stores.map((store) =>
        api.get(`/stores/${store.id}/products`)
          .then((r) =>
            (r.data as Product[])
              .filter((p) => p.is_active)
              .map((p) => ({ ...p, storeName: store.name, storeSlug: store.slug }))
          )
          .catch(() => [] as Product[])
      )
    )
      .then((results) => setAll(results.flat()))
      .finally(() => setLoading(false));
  }, [query, stores]);

  // 3. Filtrar + ordenar en cliente
  const results = useMemo(() => {
    const q = query.toLowerCase();
    let filtered = allProducts.filter((p) => {
      const matchQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.storeName?.toLowerCase().includes(q);
      const matchPrice  = maxPrice === '' || p.price <= Number(maxPrice);
      const matchStore  = !storeFilter || p.store_id === storeFilter;
      return matchQuery && matchPrice && matchStore;
    });

    if (sort === 'price_asc')  filtered = [...filtered].sort((a, b) => a.price - b.price);
    if (sort === 'price_desc') filtered = [...filtered].sort((a, b) => b.price - a.price);
    if (sort === 'name')       filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title));

    return filtered;
  }, [allProducts, query, maxPrice, storeFilter, sort]);

  // Actualizar URL al buscar
  const handleSearch = (val: string) => {
    setInputVal(val);
    const params = new URLSearchParams();
    if (val.trim()) params.set('q', val.trim());
    router.replace(`/search?${params.toString()}`, { scroll: false });
    setQuery(val);
  };

  const handleAddToCart = (product: Product) => {
    addItem({
      productId: product._id,
      storeId:   product.store_id,
      title:     product.title,
      price:     product.price,
      stock:     product.stock,
      sku:       product.sku,
      image:     product.images?.[0],
    });
    setAddedId(product._id);
    setTimeout(() => setAddedId(null), 1500);
    openCart();
  };

  const clearFilters = () => {
    setMaxPrice('');
    setStoreFilter('');
    setSort('relevance');
  };

  const hasFilters = maxPrice !== '' || storeFilter !== '' || sort !== 'relevance';

  return (
    <div className="min-h-screen bg-[var(--bg)] pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">

        {/* ── Barra de búsqueda ───────────────────────── */}
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
            <input
              autoFocus
              type="text"
              value={inputVal}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar productos en todas las tiendas..."
              className="w-full pl-14 pr-14 py-4 bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--border-focus)] rounded-2xl text-[var(--text-primary)] placeholder-[var(--text-muted)] text-base outline-none transition-all shadow-xl shadow-black/30"
            />
            {inputVal && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Controles filtros */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl border transition-all ${
                showFilters || hasFilters
                  ? 'bg-[var(--accent)]/10 border-[var(--accent-border)] text-[var(--accent-bright)]'
                  : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)]'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
              {hasFilters && (
                <span className="w-5 h-5 bg-[var(--accent)] text-[var(--text-primary)] text-xs rounded-full flex items-center justify-center font-bold">
                  {[maxPrice !== '', storeFilter !== '', sort !== 'relevance'].filter(Boolean).length}
                </span>
              )}
            </button>

            {/* Sort inline */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <ArrowUpDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSort(opt.value)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    sort === opt.value
                      ? 'bg-[var(--accent)]/10 border-[var(--accent-border)] text-[var(--accent-bright)]'
                      : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-[var(--text-muted)] hover:text-red-400 flex items-center gap-1 transition-colors ml-auto"
              >
                <X className="w-3 h-3" /> Limpiar filtros
              </button>
            )}
          </div>

          {/* Panel de filtros expandible */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 flex flex-col sm:flex-row gap-5">
                  {/* Precio máximo */}
                  <div className="flex flex-col gap-2 flex-1">
                    <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest">
                      Precio máximo
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">$</span>
                      <input
                        type="number"
                        min={0}
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
                        placeholder="Sin límite"
                        className="w-full pl-7 pr-4 py-2.5 bg-[var(--surface-2)] border border-[var(--border-hover)] focus:border-[var(--border-focus)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Filtro por tienda */}
                  <div className="flex flex-col gap-2 flex-1">
                    <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest">
                      Tienda
                    </label>
                    <select
                      value={storeFilter}
                      onChange={(e) => setStoreFilter(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[var(--surface-2)] border border-[var(--border-hover)] focus:border-[var(--border-focus)] rounded-xl text-[var(--text-primary)] text-sm outline-none transition-all"
                    >
                      <option value="">Todas las tiendas</option>
                      {stores.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Resultados ──────────────────────────────── */}
        {!query.trim() && (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="w-20 h-20 bg-[var(--surface)] border border-[var(--border)] rounded-3xl flex items-center justify-center">
              <Search className="w-9 h-9 text-[var(--text-muted)]" />
            </div>
            <div>
              <p className="text-[var(--text-primary)] font-semibold text-lg">¿Qué estás buscando?</p>
              <p className="text-[var(--text-muted)] text-sm mt-1">Escribe un producto, categoría o nombre de tienda</p>
            </div>
          </div>
        )}

        {query.trim() && loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {query.trim() && !loading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="w-20 h-20 bg-[var(--surface)] border border-[var(--border)] rounded-3xl flex items-center justify-center">
              <Package className="w-9 h-9 text-[var(--text-muted)]" />
            </div>
            <div>
              <p className="text-[var(--text-primary)] font-semibold text-lg">Sin resultados para "{query}"</p>
              <p className="text-[var(--text-muted)] text-sm mt-1">Prueba con otro término o quita los filtros</p>
            </div>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-[var(--accent-bright)] hover:text-[var(--accent-bright)] transition-colors"
              >
                Quitar filtros
              </button>
            )}
          </div>
        )}

        {query.trim() && !loading && results.length > 0 && (
          <>
            <p className="text-sm text-[var(--text-muted)]">
              <span className="text-[var(--text-primary)] font-semibold">{results.length}</span> resultados para "{query}"
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              <AnimatePresence mode="popLayout">
                {results.map((product, i) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.03 }}
                    whileHover={{ y: -4 }}
                    className="group bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-border)] rounded-2xl overflow-hidden transition-all duration-300 flex flex-col"
                  >
                    {/* Imagen */}
                    <Link href={`/store/${product.storeSlug}/product/${product._id}`} className="block">
                      <div className="h-44 bg-gradient-to-br from-[var(--accent-subtle)] via-[var(--surface-3)] to-[var(--surface-2)] relative flex items-center justify-center overflow-hidden">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <Package className="w-12 h-12 text-[var(--accent-bright)]/40" />
                        )}
                        {product.stock === 0 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-xs font-medium text-[var(--text-primary)] bg-black/50 px-3 py-1 rounded-full">Agotado</span>
                          </div>
                        )}
                        {product.stock > 0 && product.stock <= 5 && (
                          <div className="absolute top-3 left-3 text-xs bg-orange-500/20 border border-orange-500/30 text-orange-400 px-2 py-0.5 rounded-full">
                            Últimas {product.stock}
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="p-4 flex flex-col gap-2 flex-1">
                      {/* Nombre tienda */}
                      <Link
                        href={`/store/${product.storeSlug}`}
                        className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--accent-bright)] transition-colors w-fit"
                      >
                        <Store className="w-3 h-3" />
                        {product.storeName}
                      </Link>

                      <Link href={`/store/${product.storeSlug}/product/${product._id}`}>
                        <h3 className="font-semibold text-[var(--text-primary)] text-sm group-hover:text-[var(--accent-bright)] transition-colors leading-tight">
                          {product.title}
                        </h3>
                      </Link>

                      {product.description && (
                        <p className="text-[var(--text-muted)] text-xs line-clamp-2">{product.description}</p>
                      )}

                      <div className="flex items-center justify-between mt-auto pt-2">
                        <span className="text-xl font-bold text-[var(--accent-bright)]">
                          ${product.price.toLocaleString()}
                        </span>
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock === 0}
                          className="flex items-center gap-1.5 text-xs bg-[var(--accent)] hover:bg-[var(--accent-bright)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--text-primary)] px-3 py-2 rounded-lg transition-all"
                        >
                          {addedId === product._id ? (
                            <><CheckCircle className="w-3.5 h-3.5" /> Agregado</>
                          ) : (
                            <><ShoppingCart className="w-3.5 h-3.5" /> Agregar</>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Página exportada con Suspense (requerido por useSearchParams) ──
export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
