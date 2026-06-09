'use client';

/**
 * CategoryAccordion — Adaptado de "interactive-image-accordion" (21st.dev)
 * a Shopper: paleta hueso/terracota/ink, 8 categorías reales, navegación
 * directa a /search, ARIA labels, touch fallback.
 *
 * Patrón: cada tile colapsa a 60px y la activa se expande hasta 5x el ancho.
 * Hover (desktop) o tap (mobile) cambia la tile activa.
 */

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

type CatItem = {
  slug:  string;
  title: string;
  it?:   string;          // segunda palabra opcional para itálica
  img:   string;
  count: number;
  blurb: string;
};

const UNSPLASH = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`;

const CATEGORIES: CatItem[] = [
  { slug: 'moda',       title: 'Moda',       it: 'y Ropa',  img: UNSPLASH('photo-1483985988355-763728e1935b'), count: 482, blurb: 'Diseño independiente' },
  { slug: 'hogar',      title: 'Hogar',      it: 'y Deco',  img: UNSPLASH('photo-1555041469-a586c61ea9bc'),    count: 311, blurb: 'Para tu espacio'        },
  { slug: 'tecnologia', title: 'Tecnología',                img: UNSPLASH('photo-1518770660439-4636190af475'), count: 268, blurb: 'Lo último en gadgets'   },
  { slug: 'artesanias', title: 'Artesanías',                img: UNSPLASH('photo-1528150177508-7cc0c36cda5c'), count: 197, blurb: 'Hecho a mano'           },
  { slug: 'alimentos',  title: 'Alimentos',                 img: UNSPLASH('photo-1542838132-92c53300491e'),    count: 154, blurb: 'Sabor de origen'        },
  { slug: 'deportes',   title: 'Deportes',                  img: UNSPLASH('photo-1571902943202-507ec2618e8f'), count: 142, blurb: 'Para moverte'           },
  { slug: 'belleza',    title: 'Belleza',                   img: UNSPLASH('photo-1596462502278-27bfdc403348'), count: 209, blurb: 'Cuidado natural'        },
  { slug: 'ninos',      title: 'Niños',                     img: UNSPLASH('photo-1503944583220-79d8926ad5e2'), count: 118, blurb: 'Para los peques'        },
];

interface ItemProps {
  item:        CatItem;
  isActive:    boolean;
  onActivate:  () => void;
}

function AccordionItem({ item, isActive, onActivate }: ItemProps) {
  return (
    <Link
      href={`/search?category=${item.slug}`}
      aria-label={`Ver categoría ${item.title}${item.it ? ' ' + item.it : ''}`}
      onMouseEnter={onActivate}
      onFocus={onActivate}
      onTouchStart={onActivate}
      className={[
        'group relative h-[420px] sm:h-[480px] rounded-2xl overflow-hidden cursor-pointer',
        'transition-[flex,box-shadow] duration-700 ease-[cubic-bezier(.22,.61,.36,1)]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2',
        isActive ? 'flex-[6] sm:flex-[5]' : 'flex-[0.6] sm:flex-[0.5]',
        isActive ? 'shadow-[0_20px_60px_rgba(40,30,18,.22)]' : 'shadow-[0_2px_8px_rgba(40,30,18,.06)]',
      ].join(' ')}
    >
      <img
        src={item.img}
        alt=""
        loading="lazy"
        className={[
          'absolute inset-0 w-full h-full object-cover',
          'transition-transform duration-1000 ease-out',
          isActive ? 'scale-100' : 'scale-110',
        ].join(' ')}
      />

      {/* Capa de tinta sobre la imagen — más oscura cuando colapsada */}
      <div
        className={[
          'absolute inset-0 transition-opacity duration-700',
          isActive
            ? 'bg-gradient-to-t from-[#221d16]/85 via-[#221d16]/15 to-transparent'
            : 'bg-[#221d16]/70',
        ].join(' ')}
      />

      {/* Capa terracota sutil al activar */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-tr from-[rgba(199,90,43,.12)] to-transparent pointer-events-none" />
      )}

      {/* Título — vertical cuando colapsado, horizontal cuando expandido */}
      <span
        className={[
          'absolute left-0 right-0 text-[var(--bone-2)] font-semibold whitespace-nowrap pointer-events-none',
          'transition-all duration-500 ease-out',
          'origin-left',
          isActive
            ? 'bottom-7 left-7 text-2xl sm:text-3xl rotate-0 tracking-tight'
            : 'left-[50%] -translate-x-1/2 bottom-24 text-sm rotate-90',
        ].join(' ')}
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {item.title}
        {item.it && isActive && (
          <span
            className="ml-2 text-[var(--accent-bright)]"
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400 }}
          >
            {item.it}
          </span>
        )}
      </span>

      {/* Meta (blurb + count + arrow) — solo cuando activo */}
      <motion.div
        className="absolute right-6 bottom-7 flex items-end gap-4 pointer-events-none"
        initial={false}
        animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1], delay: isActive ? 0.25 : 0 }}
      >
        <div className="text-right text-[var(--bone-2)]/85 hidden sm:block">
          <div className="text-[11px] uppercase tracking-[0.14em] mb-0.5">{item.blurb}</div>
          <div className="text-xs font-medium tabular-nums">{item.count} productos</div>
        </div>
        <span className="w-11 h-11 rounded-full bg-[var(--bone-2)]/15 backdrop-blur-md border border-[var(--bone-2)]/20 grid place-items-center text-[var(--bone-2)] transition-all group-hover:bg-[var(--primary)] group-hover:border-[var(--primary)]">
          <ArrowUpRight className="w-4 h-4" />
        </span>
      </motion.div>

      {/* Reduced motion */}
      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          a {
            transition-duration: 0.01ms !important;
          }
          img {
            transition: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </Link>
  );
}

export default function CategoryAccordion({
  initialActive = 0,
}: {
  initialActive?: number;
}) {
  const [active, setActive] = useState(initialActive);

  return (
    <div
      className="flex flex-row items-stretch gap-2 sm:gap-3 w-full"
      role="tablist"
      aria-label="Categorías del marketplace"
    >
      {CATEGORIES.map((it, i) => (
        <AccordionItem
          key={it.slug}
          item={it}
          isActive={i === active}
          onActivate={() => setActive(i)}
        />
      ))}
    </div>
  );
}
