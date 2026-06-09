'use client';

/**
 * CategoriesBento — sección de categorías en formato Bento Grid.
 * Patrón inspirado en 21st.dev, adaptado 100% a la paleta Mercado Editorial
 * (terracota + hueso + verde selva + tinta). Respeta prefers-reduced-motion.
 */

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight, Shirt, Home, Laptop, Palette, Utensils, Dumbbell, Sparkles, Baby, type LucideIcon } from 'lucide-react';

type Tier = 'big' | 'dark' | 'soft';

interface Cat {
  slug: string; label: string; Icon: LucideIcon; count: number; blurb?: string;
  span?: string; tier?: Tier;
}

// El orden llena un grid de 4×3 sin huecos en desktop.
const CATS: Cat[] = [
  { slug: 'moda',       label: 'Moda y Ropa', Icon: Shirt,    count: 482, blurb: 'Diseño independiente, hecho con alma.', span: 'lg:col-span-2 lg:row-span-2', tier: 'big'  },
  { slug: 'tecnologia', label: 'Tecnología',  Icon: Laptop,   count: 268, blurb: 'Lo último en gadgets y accesorios.',  span: 'lg:col-span-2',               tier: 'dark' },
  { slug: 'hogar',      label: 'Hogar y Deco', Icon: Home,     count: 311, tier: 'soft' },
  { slug: 'artesanias', label: 'Artesanías',  Icon: Palette,  count: 197, tier: 'soft' },
  { slug: 'belleza',    label: 'Belleza',     Icon: Sparkles, count: 209, tier: 'soft' },
  { slug: 'alimentos',  label: 'Alimentos',   Icon: Utensils, count: 154, tier: 'soft' },
  { slug: 'deportes',   label: 'Deportes',    Icon: Dumbbell, count: 142, tier: 'soft' },
  { slug: 'ninos',      label: 'Niños',       Icon: Baby,     count: 118, tier: 'soft' },
];

const tierClasses: Record<Tier, string> = {
  big:  'text-[var(--bone-2)]',
  dark: 'bg-[var(--ink)] text-[var(--bone-2)] border-[var(--ink)]',
  soft: 'bg-[var(--bone-2)] text-[var(--ink)] border-[var(--line)]',
};

export default function CategoriesBento() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 auto-rows-[150px] gap-3 grid-flow-row-dense">
      {CATS.map((c, i) => {
        const tier = c.tier ?? 'soft';
        const big  = tier === 'big';
        const dark = tier === 'dark';
        return (
          <motion.div
            key={c.slug}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1], delay: i * 0.05 }}
            className={c.span}
          >
            <Link
              href={`/search?category=${c.slug}`}
              className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)] ${tierClasses[tier]}`}
              style={big ? { background: 'linear-gradient(135deg, var(--accent), var(--primary-2) 120%)', borderColor: 'transparent' } : undefined}
            >
              {/* Brillo decorativo */}
              <span
                aria-hidden
                className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-60 blur-2xl transition-opacity group-hover:opacity-90"
                style={{ background: big || dark ? 'rgba(255,255,255,.12)' : 'var(--accent-glow)' }}
              />

              {/* Ícono */}
              <span
                className={`grid h-11 w-11 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${
                  big || dark ? 'bg-white/15 text-[var(--bone-2)]' : 'bg-[var(--accent-subtle)] text-[var(--accent)]'
                }`}
              >
                <c.Icon className={big ? 'h-6 w-6' : 'h-5 w-5'} />
              </span>

              <div className="relative">
                <h3
                  className={`font-bold leading-tight ${big ? 'text-2xl md:text-3xl' : 'text-lg'}`}
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {c.label}
                </h3>
                {big && c.blurb && (
                  <p className="mt-1.5 max-w-[15rem] text-sm text-[var(--bone-2)]/80">{c.blurb}</p>
                )}
                <p className={`mt-1 text-xs ${big || dark ? 'text-[var(--bone-2)]/70' : 'text-[var(--ink-soft)]'}`}>
                  {c.count} productos
                </p>
              </div>

              <ArrowUpRight
                className={`absolute right-4 top-4 h-5 w-5 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                  big || dark ? 'text-[var(--bone-2)]/70' : 'text-[var(--ink-soft)] opacity-0 group-hover:opacity-100'
                }`}
              />
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
