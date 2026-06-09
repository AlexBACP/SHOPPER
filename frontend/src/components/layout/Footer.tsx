'use client';

import Link from 'next/link';
import { Truck, Shield, BadgeCheck, MapPin, Mail, Heart } from 'lucide-react';
import { LogoIcon }       from '@/components/ui/LogoIcon';
import { FOOTER_LINKS, PAYMENT_METHODS } from '@/config/navigation';
import { SITE_CONFIG }    from '@/config/constants';

const TRUST_ITEMS = [
  { icono: Truck,      titulo: 'Envíos a todo Colombia',  desc: 'Seguimiento en tiempo real'                      },
  { icono: Shield,     titulo: 'Pago 100% seguro',        desc: 'SSL 256-bit · Sin cargos ocultos · IVA incluido' },
  { icono: BadgeCheck, titulo: 'Vendedores verificados',  desc: 'Cada tienda revisada por nosotros'               },
] as const;

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[var(--bone-2)] text-[var(--ink)] border-t border-[var(--line)]">

      {/* Trust bar */}
      <div className="border-b border-[var(--line)]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {TRUST_ITEMS.map(({ icono: Icono, titulo, desc }) => (
            <div key={titulo} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--bone-3)] rounded-xl flex items-center justify-center shrink-0">
                <Icono className="w-5 h-5 text-[var(--selva)]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--ink)]">{titulo}</p>
                <p className="text-xs text-[var(--ink-soft)]">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">

        {/* Logo y descripción */}
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 bg-[var(--primary)] rounded-xl flex items-center justify-center shadow-[var(--shadow-sm)]">
              <LogoIcon />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-[var(--ink)]"
              style={{ fontFamily: 'var(--font-display)' }}>{SITE_CONFIG.name}</span>
          </div>
          <p className="text-sm text-[var(--ink-soft)] leading-relaxed mb-4 max-w-[32ch]">
            El marketplace de las tiendas independientes de Colombia. Compra único, compra local.
          </p>
          <div className="space-y-1.5 text-xs text-[var(--ink-soft)]">
            <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{SITE_CONFIG.location}</div>
            <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{SITE_CONFIG.email}</div>
          </div>
          <div className="flex gap-2 flex-wrap mt-5">
            {PAYMENT_METHODS.map(m => (
              <span key={m}
                className="text-[11px] font-bold tracking-wide px-3 py-1.5 border border-[var(--line)] rounded-lg text-[var(--ink-soft)]">
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Comprar */}
        <FooterColumn titulo="Comprar" links={FOOTER_LINKS.comprar} />

        {/* Vender */}
        <FooterColumn titulo="Vender" links={FOOTER_LINKS.vender} />

        {/* Legal */}
        <FooterColumn titulo="Ayuda" links={FOOTER_LINKS.legal} />
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[var(--line)]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[13px] text-[var(--ink-soft)] text-center sm:text-left">
            © {year} {SITE_CONFIG.name} Colombia · Ley 1581/2012 · IVA 19% incluido
          </p>
          <div className="flex items-center gap-5 flex-wrap justify-center text-[13px] text-[var(--ink-soft)]">
            <Link href="/terms" className="hover:text-[var(--primary)] transition-colors">Términos</Link>
            <Link href="/privacy" className="hover:text-[var(--primary)] transition-colors">Privacidad</Link>
            <span className="inline-flex items-center gap-1">
              Hecho con <Heart className="w-3 h-3 inline fill-[var(--primary)] text-[var(--primary)]" aria-hidden="true" /> en Colombia
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Subcomponente reutilizable de columna de links ────────────────────
function FooterColumn({
  titulo,
  links,
}: {
  titulo: string;
  links: ReadonlyArray<{ href: string; label: string; external?: boolean }>;
}) {
  return (
    <div>
      <h4 className="text-[13px] font-semibold text-[var(--ink-soft)] mb-4 uppercase tracking-[0.14em]">{titulo}</h4>
      <ul className="space-y-2.5">
        {links.map(({ href, label, external }) => (
          <li key={label}>
            <Link
              href={href}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="text-[14.5px] text-[var(--ink)] hover:text-[var(--primary)] transition-colors"
            >
              {label}
              {external && <span className="text-[10px] ml-1 opacity-50">↗</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
