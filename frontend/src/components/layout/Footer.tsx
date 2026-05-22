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
    <footer className="bg-[var(--nav-bg)] text-white">

      {/* Trust bar */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {TRUST_ITEMS.map(({ icono: Icono, titulo, desc }) => (
            <div key={titulo} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                <Icono className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{titulo}</p>
                <p className="text-xs text-white/50">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">

        {/* Logo y descripción */}
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
              <LogoIcon />
            </div>
            <span className="text-lg font-black text-white">{SITE_CONFIG.name}</span>
          </div>
          <p className="text-sm text-white/50 leading-relaxed mb-4">
            El marketplace colombiano con las mejores tiendas independientes del país. Compra segura, IVA incluido.
          </p>
          <div className="space-y-1.5 text-xs text-white/40">
            <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{SITE_CONFIG.location} 🇨🇴</div>
            <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{SITE_CONFIG.email}</div>
          </div>
        </div>

        {/* Comprar */}
        <FooterColumn titulo="Comprar" links={FOOTER_LINKS.comprar} />

        {/* Vender */}
        <FooterColumn titulo="Vender" links={FOOTER_LINKS.vender} />

        {/* Legal */}
        <FooterColumn titulo="Legal" links={FOOTER_LINKS.legal} />
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30 text-center sm:text-left">
            © {year} {SITE_CONFIG.name} Colombia · Hecho con{' '}
            <Heart className="w-3 h-3 inline fill-rose-500 text-rose-500" aria-hidden="true" />{' '}
            en Colombia · Ley 1581/2012 · IVA 19% incluido
          </p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            {PAYMENT_METHODS.map(m => (
              <span key={m} className="text-xs text-white/25 font-bold">{m}</span>
            ))}
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
      <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">{titulo}</h4>
      <ul className="space-y-2.5">
        {links.map(({ href, label, external }) => (
          <li key={label}>
            <Link
              href={href}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="text-sm text-white/50 hover:text-white transition-colors"
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
