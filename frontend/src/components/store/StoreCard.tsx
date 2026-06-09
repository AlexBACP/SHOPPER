'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BadgeCheck, Star, Package, ArrowUpRight } from 'lucide-react';

export interface StoreCardData {
  id:           string;
  slug:         string;
  name:         string;
  description?: string;
  logo_url?:    string;
}

interface StoreCardProps {
  store:         StoreCardData;
  /** Calificación promedio (0–5). Si no se pasa, no se muestra. */
  rating?:       number;
  /** Número de reseñas. */
  reviewCount?:  number;
  /** Número de productos de la tienda. */
  productCount?: number;
  className?:    string;
}

/**
 * Tarjeta editorial de tienda. Layout: logo + nombre/verificada + descripción
 * + footer con rating o número de productos. Banda terracota arriba al hover.
 */
export default function StoreCard({
  store, rating, reviewCount, productCount, className = '',
}: StoreCardProps) {
  const tieneRating = typeof rating === 'number' && rating > 0;

  return (
    <motion.div whileHover={{ y: -3 }} className={className}>
      <Link href={`/store/${store.slug}`} className="eds-storecard">
        <div className="eds-storecard-h">
          <div className="eds-storecard-logo">
            {store.logo_url
              ? <img src={store.logo_url} alt={store.name} loading="lazy" />
              : <span className="fb">{store.name[0]?.toUpperCase()}</span>}
          </div>
          <div>
            <div className="nm">{store.name}</div>
            <span className="verified">
              <BadgeCheck className="w-3 h-3" /> Verificada
            </span>
          </div>
        </div>

        {store.description && (
          <p className="desc">{store.description}</p>
        )}

        <div className="eds-storecard-foot">
          {tieneRating ? (
            <span className="rating">
              <Star className="w-3.5 h-3.5" fill="currentColor" strokeWidth={0} />
              {rating!.toFixed(1)}
              {typeof reviewCount === 'number' && <span style={{ opacity: .6 }}>· {reviewCount}</span>}
            </span>
          ) : typeof productCount === 'number' ? (
            <span className="rating">
              <Package className="w-3.5 h-3.5" />
              {productCount} prod.
            </span>
          ) : (
            <span>Tienda nueva</span>
          )}
          <span className="visit">
            Visitar <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
