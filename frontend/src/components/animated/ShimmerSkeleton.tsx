'use client';

/**
 * ShimmerSkeleton — skeleton con efecto shimmer cálido para Shopper.
 * Usa la paleta del proyecto (no gris genérico).
 *
 * <ShimmerSkeleton className="h-32 w-full rounded-2xl" />
 */

import { motion } from 'framer-motion';

interface Props {
  className?: string;
  /** Forma rápida: 'card' | 'text' | 'circle' */
  variant?:   'card' | 'text' | 'circle';
}

export default function ShimmerSkeleton({ className = '', variant }: Props) {
  const variantClasses = {
    card:   'h-64 w-full rounded-2xl',
    text:   'h-4 w-full rounded',
    circle: 'h-10 w-10 rounded-full',
  };
  const base = variant ? variantClasses[variant] : '';

  return (
    <div
      className={`relative overflow-hidden ${base} ${className}`}
      style={{ background: 'var(--surface-2)' }}
      aria-hidden
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
        }}
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

/** Tarjeta de producto en skeleton — usar mientras carga el grid */
export function ProductCardSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{
        background: 'var(--surface)',
        border:     '1px solid var(--border)',
      }}
    >
      <ShimmerSkeleton className="aspect-[4/5] w-full" />
      <div className="space-y-2 p-4">
        <ShimmerSkeleton variant="text" className="!w-1/3" />
        <ShimmerSkeleton variant="text" className="!w-4/5" />
        <ShimmerSkeleton variant="text" className="!w-1/2 !h-5" />
      </div>
    </div>
  );
}
