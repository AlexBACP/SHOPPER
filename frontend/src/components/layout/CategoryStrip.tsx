'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { CATEGORIES } from '@/config/navigation';

/**
 * Tira horizontal de categorías para mobile (P1.9). Permite filtrar el
 * catálogo sin abrir un menú extra. Sticky debajo del header y solo visible
 * en pantallas pequeñas (el desktop ya tiene sus propios filtros).
 */
export default function CategoryStrip() {
  const pathname = usePathname();
  const params   = useSearchParams();
  const activa   = params.get('category') ?? params.get('categoria') ?? '';

  // Solo en home, búsqueda y tiendas (donde tiene sentido descubrir categorías).
  const visible = pathname === '/' || pathname.startsWith('/search') || pathname.startsWith('/store');
  if (!visible) return null;

  const chip = 'shrink-0 snap-start px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-colors';

  return (
    <nav
      aria-label="Categorías"
      className="md:hidden sticky top-[72px] z-20 bg-[var(--bg)]/95 backdrop-blur border-b border-[var(--line)]"
    >
      <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory px-4 py-2.5 no-sb">
        <Link
          href="/search"
          className={`${chip} ${activa === ''
            ? 'bg-[var(--ink)] text-[var(--bone-2)] border-[var(--ink)]'
            : 'bg-[var(--bone-2)] text-[var(--ink)] border-[var(--line)]'}`}
        >
          Todas
        </Link>
        {CATEGORIES.map(c => (
          <Link
            key={c.slug}
            href={`/search?category=${c.slug}`}
            className={`${chip} ${activa === c.slug
              ? 'bg-[var(--ink)] text-[var(--bone-2)] border-[var(--ink)]'
              : 'bg-[var(--bone-2)] text-[var(--ink)] border-[var(--line)]'}`}
          >
            {c.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
