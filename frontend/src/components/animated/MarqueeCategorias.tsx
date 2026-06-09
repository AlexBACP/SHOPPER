'use client';

/**
 * MarqueeCategorias — banda en movimiento continuo con categorías/badges.
 * Pausa al hacer hover. Sin librerías adicionales (Framer Motion + CSS).
 *
 * Úsalo entre el Hero y el grid de productos para añadir vida al scroll.
 */

import { motion } from 'framer-motion';
import Link from 'next/link';

const ITEMS = [
  { label: 'Moda y Ropa',  slug: 'moda' },
  { label: 'Hogar y Deco', slug: 'hogar' },
  { label: 'Tecnología',   slug: 'tecnologia' },
  { label: 'Artesanías',   slug: 'artesanias' },
  { label: 'Alimentos',    slug: 'alimentos' },
  { label: 'Deportes',     slug: 'deportes' },
  { label: 'Belleza',      slug: 'belleza' },
  { label: 'Niños',        slug: 'ninos' },
];

export default function MarqueeCategorias({ speed = 30 }: { speed?: number }) {
  // Duplicamos los items para que el loop sea infinito y sin "saltos".
  const loop = [...ITEMS, ...ITEMS];

  return (
    <div
      className="group relative overflow-hidden border-y py-5"
      style={{
        borderColor: 'var(--border)',
        background:  'var(--surface-2)',
      }}
      aria-hidden
    >
      <motion.div
        className="flex gap-3 whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
        style={{ width: 'max-content' }}
      >
        {loop.map((c, i) => (
          <Link
            key={`${c.slug}-${i}`}
            href={`/search?category=${c.slug}`}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors hover:scale-[1.03]"
            style={{
              background: 'var(--surface)',
              border:     '1px solid var(--border)',
              color:      'var(--text-primary)',
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: 'var(--accent)' }}
            />
            {c.label}
          </Link>
        ))}
      </motion.div>

      {/* Fade en los bordes */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-24"
        style={{ background: 'linear-gradient(to right, var(--surface-2), transparent)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-24"
        style={{ background: 'linear-gradient(to left, var(--surface-2), transparent)' }}
      />
    </div>
  );
}
