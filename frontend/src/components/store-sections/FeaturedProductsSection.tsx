'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Package, ShoppingCart, CheckCircle } from 'lucide-react';
import type { FeaturedProductsSettings } from '@/types';
import { useStorefront } from './StorefrontContext';

const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

// Grid de productos destacados. Si no hay `product_ids` muestra los primeros.
export default function FeaturedProductsSection({ settings }: { settings: FeaturedProductsSettings }) {
  const { productos, tienda, agregar, agregadoId } = useStorefront();
  const cols       = settings.columns ?? 4;
  const showPrice  = settings.show_price !== false;
  const showCart   = settings.show_add_to_cart !== false;
  const ids        = settings.product_ids ?? [];
  const lista      = (ids.length ? productos.filter(p => ids.includes(p._id)) : productos).slice(0, cols * 2);

  const colsCls =
    cols === 2 ? 'sm:grid-cols-2' :
    cols === 3 ? 'sm:grid-cols-3' :
    cols === 5 ? 'sm:grid-cols-3 lg:grid-cols-5' :
    'sm:grid-cols-2 lg:grid-cols-4';

  return (
    <motion.div key="featured" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {settings.title && <h2 className="text-xl font-bold text-[var(--ink)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>{settings.title}</h2>}

      {lista.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center text-[var(--text-muted)]">
          <Package className="w-10 h-10 mb-2 text-[var(--border-hover)]" />
          <p className="text-sm">Sin productos para destacar todavía</p>
        </div>
      ) : (
        <div className={`grid grid-cols-2 ${colsCls} gap-4`}>
          {lista.map(p => (
            <div key={p._id} className="bg-[var(--bone-2)] border border-[var(--line)] rounded-lg overflow-hidden group transition-all hover:shadow-md">
              <Link href={`/store/${tienda.slug}/product/${p._id}`}>
                <div className="aspect-square bg-[var(--surface-2)] relative overflow-hidden">
                  {p.images?.[0]
                    ? <img src={p.images[0]} alt={p.title} className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-[var(--border-hover)]" /></div>}
                </div>
              </Link>
              <div className="p-3">
                <Link href={`/store/${tienda.slug}/product/${p._id}`}>
                  <h3 className="text-sm font-medium text-[var(--ink)] line-clamp-2 hover:text-[var(--primary)] transition-colors min-h-[2.5rem]">{p.title}</h3>
                </Link>
                {showPrice && <p className="text-base font-bold text-[var(--ink)] mb-2">{fmt(p.price)}</p>}
                {showCart && (
                  <button onClick={() => agregar(p)} disabled={p.stock === 0}
                    className={`w-full py-1.5 text-xs font-bold rounded-lg transition-all ${
                      agregadoId === p._id ? 'bg-[var(--selva-soft)] text-[var(--selva)]' : 'bg-[var(--ink)] hover:bg-[var(--primary-2)] text-[var(--bone-2)] disabled:opacity-40'
                    }`}>
                    {agregadoId === p._id ? <><CheckCircle className="w-3 h-3 inline mr-1"/>¡Agregado!</> : <><ShoppingCart className="w-3 h-3 inline mr-1"/>Agregar</>}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
