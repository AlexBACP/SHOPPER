'use client';

/**
 * StoresCarousel — 2 columnas verticales infinitas.
 *  · Columna izquierda: sube (y: ['0%', '-50%'])
 *  · Columna derecha:   baja (y: ['-50%', '0%'])
 *  · Hover sobre la columna → pausa esa columna
 *  · Cards limpias: imagen + nombre + descripción + CTA inline. SIN reveal.
 *  · Respeta `prefers-reduced-motion` (scroll manual con snap).
 */

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { ShieldCheck, ArrowUpRight, Package } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Store as TipoTienda } from '@/types';

const FALLBACK_BANNERS = [
  'photo-1483985988355-763728e1935b',
  'photo-1555041469-a586c61ea9bc',
  'photo-1518770660439-4636190af475',
  'photo-1528150177508-7cc0c36cda5c',
  'photo-1542838132-92c53300491e',
  'photo-1571902943202-507ec2618e8f',
  'photo-1596462502278-27bfdc403348',
  'photo-1503944583220-79d8926ad5e2',
  'photo-1606293459339-aa5d34a7b0e1',
  'photo-1559056199-641a0ac8b55e',
  'photo-1578500494198-246f612d3b3d',
  'photo-1576091160550-2173dba999ef',
];

const UNSPLASH = (id: string, w = 900) =>
  `https://images.unsplash.com/${id}?w=${w}&q=82&auto=format&fit=crop`;

/* ────────────────────────────────────────────────────────────────────
   CARD — Limpia, sin reveal. Imagen arriba, contenido abajo.
   ──────────────────────────────────────────────────────────────────── */
interface CardProps {
  store:         TipoTienda;
  fallbackIdx:   number;
  productCount?: number;
}

function StoreCard({ store, fallbackIdx, productCount }: CardProps) {
  const banner = store.theme?.banner
    || UNSPLASH(FALLBACK_BANNERS[fallbackIdx % FALLBACK_BANNERS.length]);

  return (
    <article
      className="stcar-card group relative w-full rounded-2xl overflow-hidden bg-[var(--bone-2)] border border-[var(--ed-hairline)] transition-transform duration-300"
      style={{
        boxShadow: '0 2px 8px rgba(40,30,18,.06), 0 14px 32px rgba(40,30,18,.08)',
      }}
    >
      <Link
        href={`/store/${store.slug}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 rounded-2xl"
        aria-label={`Visitar ${store.name}`}
      >
        {/* Imagen arriba */}
        <div className="relative overflow-hidden" style={{ aspectRatio: '5 / 4' }}>
          <img
            src={banner}
            alt={store.name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />

          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-[var(--bone-2)]/95 backdrop-blur-sm text-[var(--selva)] text-[10.5px] font-bold tracking-[.06em] px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3 h-3" /> Verificada
          </span>

          {typeof productCount === 'number' && productCount > 0 && (
            <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-[var(--ink)]/85 backdrop-blur-sm text-[var(--bone-2)] text-[10.5px] font-bold tracking-[.04em] px-2.5 py-1 rounded-full">
              <Package className="w-3 h-3" /> {productCount}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="px-4 py-4">
          <h3
            className="text-[var(--ink)] text-[16px] leading-tight font-bold mb-1.5 group-hover:text-[var(--primary)] transition-colors"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-.012em' }}
          >
            {store.name}
          </h3>
          {store.description && (
            <p
              className="text-[12.5px] text-[var(--ink-soft)] leading-relaxed mb-3"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {store.description}
            </p>
          )}
          <div className="flex items-center justify-between pt-2.5 border-t border-[var(--ed-hairline)]">
            <span className="text-[11px] font-semibold text-[var(--ink-soft)]">
              {productCount && productCount > 0 ? `${productCount} productos` : 'Tienda activa'}
            </span>
            <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[var(--primary)] transition-all group-hover:gap-1.5">
              Visitar
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

/* ────────────────────────────────────────────────────────────────────
   COLUMNA INFINITA VERTICAL
   ──────────────────────────────────────────────────────────────────── */
interface ColumnProps {
  stores:         TipoTienda[];
  fallbackOffset: number;
  productCounts?: Record<string, number>;
  duration:       number;
  direction:      'up' | 'down';
}

function MarqueeColumn({
  stores, fallbackOffset, productCounts, duration, direction,
}: ColumnProps) {
  const shouldReduceMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);

  const loop = useMemo(() => [...stores, ...stores], [stores]);

  const moving = !shouldReduceMotion && !paused;
  const yRange = direction === 'up' ? ['0%', '-50%'] : ['-50%', '0%'];

  return (
    <div
      className="stcar-col"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <motion.div
        className="stcar-col-track"
        animate={moving ? { y: yRange } : { y: direction === 'up' ? '0%' : '-50%' }}
        transition={
          moving
            ? { duration, repeat: Infinity, ease: 'linear' }
            : { duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }
        }
      >
        {loop.map((s, i) => (
          <StoreCard
            key={`${s.id}-${i}`}
            store={s}
            fallbackIdx={fallbackOffset + i}
            productCount={productCounts?.[s.id]}
          />
        ))}
      </motion.div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
   COMPONENTE PRINCIPAL
   ──────────────────────────────────────────────────────────────────── */
interface Props {
  tiendas:        TipoTienda[];
  productCounts?: Record<string, number>;
}

export default function StoresCarousel({ tiendas, productCounts }: Props) {
  if (!tiendas || tiendas.length === 0) return null;

  const half = Math.ceil(tiendas.length / 2);
  let col1 = tiendas.slice(0, half);
  let col2 = tiendas.slice(half);

  if (col2.length < Math.max(2, half - 1)) {
    col2 = [...col1].reverse();
  }

  return (
    <section className="sec wrap stcar" aria-labelledby="tiendas-heading">
      <div className="ed-sec-head stcar-head">
        <h2 className="ed-sec-title" id="tiendas-heading">
          Tiendas que <span className="it">amamos</span>
        </h2>
        <Link href="/search" className="ed-sec-link">
          Conocer todas
          <ArrowUpRight className="w-[16px] h-[16px]" />
        </Link>
      </div>

      <div className="stcar-grid">
        <MarqueeColumn
          stores={col1}
          fallbackOffset={0}
          productCounts={productCounts}
          duration={42}
          direction="up"
        />
        <MarqueeColumn
          stores={col2}
          fallbackOffset={half}
          productCounts={productCounts}
          duration={48}
          direction="down"
        />
      </div>
    </section>
  );
}
