'use client';

/**
 * AnimatedProductCard — tarjeta de producto con micro-interacciones premium.
 *
 * Animaciones incluidas:
 *  · Lift on hover (eleva con sombra cálida)
 *  · Zoom suave de la imagen
 *  · Reveal de acciones secundarias (wishlist, vista rápida)
 *  · Pulse del badge "nuevo" / "descuento"
 *  · Spring en el botón "Agregar al carrito"
 *
 * Diseñada para reemplazar la TarjetaProducto actual de HomeClient.tsx.
 * Respeta totalmente la paleta Mercado Editorial (CSS vars).
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Plus, Check, Eye, Store as StoreIcon } from 'lucide-react';
import Link from 'next/link';
import { useState, type MouseEvent } from 'react';
import { flyToCart } from '@/lib/flyToCart';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export interface AnimatedProductCardProps {
  id:                string;
  title:             string;
  price:             number;
  compareAtPrice?:   number;
  image:             string;
  storeName:         string;
  storeSlug:         string;
  storeId:           string;
  sku:               string;
  stock:             number;
  isNew?:            boolean;
  onAddToCart?:      () => void;
  onToggleWishlist?: () => void;
  isFavorite?:       boolean;
}

export default function AnimatedProductCard({
  id, title, price, compareAtPrice, image, storeName, storeSlug,
  stock, isNew, onAddToCart, onToggleWishlist, isFavorite,
}: AnimatedProductCardProps) {
  const [added, setAdded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const discount = compareAtPrice && compareAtPrice > price
    ? Math.round((1 - price / compareAtPrice) * 100)
    : 0;

  const handleAdd = (e: MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    flyToCart({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, image);
    onAddToCart?.();
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <motion.article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl"
      style={{
        background: 'var(--surface)',
        border:     '1px solid var(--border)',
        boxShadow:  hovered ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
        transition: 'box-shadow 0.4s ease',
      }}
    >
      {/* IMAGEN + acciones */}
      <Link
        href={`/store/${storeSlug}/product/${id}`}
        className="relative block aspect-[4/5] overflow-hidden"
        style={{ background: 'var(--surface-2)' }}
      >
        <motion.img
          src={image}
          alt={title}
          animate={{ scale: hovered ? 1.07 : 1 }}
          transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />

        {/* Overlay sutil al hover */}
        <motion.div
          aria-hidden
          animate={{ opacity: hovered ? 0.15 : 0 }}
          className="absolute inset-0"
          style={{ background: 'var(--text-primary)' }}
        />

        {/* Badges flotantes (top-left) */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {isNew && (
            <motion.span
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400 }}
              className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
              style={{
                background: 'var(--accent)',
                color:      'var(--btn-cart-text)',
              }}
            >
              Nuevo
            </motion.span>
          )}
          {discount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
              style={{
                background: 'var(--text-primary)',
                color:      'var(--btn-primary-text)',
              }}
            >
              -{discount}%
            </motion.span>
          )}
        </div>

        {/* Acciones flotantes (top-right) */}
        <div className="absolute right-3 top-3 flex flex-col gap-2">
          <motion.button
            onClick={(e) => { e.preventDefault(); onToggleWishlist?.(); }}
            whileTap={{ scale: 0.85 }}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: hovered || isFavorite ? 1 : 0, x: hovered || isFavorite ? 0 : 10 }}
            transition={{ duration: 0.25 }}
            aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            className="grid h-9 w-9 place-items-center rounded-full backdrop-blur-sm"
            style={{
              background: 'rgba(250, 246, 239, 0.85)',
              border:     '1px solid var(--border)',
            }}
          >
            <Heart
              className="h-4 w-4 transition-all"
              style={{
                color: isFavorite ? 'var(--accent)' : 'var(--text-secondary)',
                fill:  isFavorite ? 'var(--accent)' : 'none',
              }}
            />
          </motion.button>

          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : 10 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className="grid h-9 w-9 place-items-center rounded-full backdrop-blur-sm"
            style={{
              background: 'rgba(250, 246, 239, 0.85)',
              border:     '1px solid var(--border)',
            }}
          >
            <Eye className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
          </motion.div>
        </div>

        {/* Stock bajo */}
        {stock > 0 && stock <= 5 && (
          <div
            className="absolute bottom-3 left-3 rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider"
            style={{
              background: 'var(--surface)',
              color:      'var(--warning)',
              border:     '1px solid var(--accent-border)',
            }}
          >
            ¡Solo {stock} disp!
          </div>
        )}
      </Link>

      {/* META */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Tienda */}
        <Link
          href={`/store/${storeSlug}`}
          className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider hover:underline"
          style={{ color: 'var(--text-muted)' }}
        >
          <StoreIcon className="h-3 w-3" />
          {storeName}
        </Link>

        {/* Título */}
        <Link
          href={`/store/${storeSlug}/product/${id}`}
          className="line-clamp-2 text-sm font-medium leading-snug"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </Link>

        {/* Precio + CTA */}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            <div
              className="text-lg font-medium"
              style={{
                fontFamily: 'var(--font-display)',
                color:      'var(--text-price)',
              }}
            >
              {fmt(price)}
            </div>
            {compareAtPrice && compareAtPrice > price && (
              <div
                className="text-xs line-through"
                style={{ color: 'var(--text-muted)' }}
              >
                {fmt(compareAtPrice)}
              </div>
            )}
          </div>

          {/* Botón agregar con micro-spring */}
          <motion.button
            onClick={handleAdd}
            whileTap={{ scale: 0.88 }}
            disabled={stock === 0}
            aria-label="Agregar al carrito"
            className="grid h-10 w-10 place-items-center rounded-full transition-colors disabled:opacity-40"
            style={{
              background: added ? 'var(--success)' : 'var(--btn-cart-bg)',
              color:      'var(--btn-cart-text)',
              boxShadow:  'var(--shadow-accent)',
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {added ? (
                <motion.span
                  key="ok"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 90 }}
                  transition={{ type: 'spring', stiffness: 500 }}
                >
                  <Check className="h-4 w-4" />
                </motion.span>
              ) : (
                <motion.span
                  key="add"
                  initial={{ scale: 0, rotate: 90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: -90 }}
                  transition={{ type: 'spring', stiffness: 500 }}
                >
                  <Plus className="h-4 w-4" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
