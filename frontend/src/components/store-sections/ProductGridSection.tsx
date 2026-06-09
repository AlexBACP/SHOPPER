'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Search, ShieldCheck, Plus, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import type { ProductGridSettings } from '@/types';
import { useStorefront } from './StorefrontContext';
import { getProductImageByTitle, getLocalImageByTitle } from '@/data/productImages';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

/**
 * Catálogo de la tienda — usa la tarjeta unificada `.pcard` para mantener
 * coherencia visual entre home/búsqueda/tienda.
 */
export default function ProductGridSection({ settings }: { settings: ProductGridSettings }) {
  const { tienda, busqueda, setBusqueda, filtrados, agregar, agregadoId } = useStorefront();
  const slug = tienda.slug;
  const showSearch = settings.show_search !== false;

  return (
    <motion.div
      key="productos"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Barra superior: buscador + contador */}
      {showSearch && (
        <div className="eds-pgrid-bar">
          <label className="eds-pgrid-search">
            <Search className="w-4 h-4" />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar en esta tienda..."
              aria-label="Buscar en esta tienda"
            />
          </label>
          <span className="eds-pgrid-count">
            <strong>{filtrados.length}</strong>
            producto{filtrados.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {filtrados.length === 0 ? (
        <div className="edsr-empty">
          <div className="edsr-empty-icon"><Package className="w-9 h-9" /></div>
          <h2>{busqueda ? <>Sin <span className="it">resultados</span></> : <>Sin <span className="it">productos</span> aún</>}</h2>
          <p>{busqueda ? 'Intenta con otro término de búsqueda.' : 'Esta tienda no tiene productos activos por el momento.'}</p>
          {busqueda && (
            <button type="button" className="btn btn-ghost" onClick={() => setBusqueda('')}>
              Limpiar búsqueda
            </button>
          )}
        </div>
      ) : (
        <div className="pgrid">
          <AnimatePresence mode="popLayout">
            {filtrados.map((p, i) => {
              const lowStock = p.stock > 0 && p.stock <= 5;
              const productHref = `/store/${slug}/product/${p._id}`;
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
                        src={getLocalImageByTitle(p.title) || p.images?.[0] || getProductImageByTitle(p.title, (p as { category?: string }).category)}
                        alt={p.title}
                        loading="lazy"
                      />
                    </Link>

                    {lowStock && <span className="pcard-low">Solo {p.stock}</span>}

                    <button
                      type="button"
                      onClick={() => agregar(p)}
                      disabled={p.stock === 0}
                      className={'pcard-add' + (agregadoId === p._id ? ' done' : '')}
                      aria-label="Agregar al carrito"
                    >
                      {agregadoId === p._id
                        ? <><CheckCircle className="w-4 h-4" /> Agregado</>
                        : <><Plus className="w-4 h-4" /> Agregar</>}
                    </button>

                    {p.stock === 0 && (
                      <div className="pcard-soldout"><span>Agotado</span></div>
                    )}
                  </div>

                  <div className="pcard-body">
                    <span className="pcard-store">
                      <ShieldCheck className="w-3 h-3" /> {tienda.name}
                    </span>
                    <h3 className="pcard-name">
                      <Link href={productHref}>{p.title}</Link>
                    </h3>
                    <div className="pcard-price">
                      <strong>{fmt(p.price)}</strong>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
