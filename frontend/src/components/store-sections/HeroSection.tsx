'use client';
import Link from 'next/link';
import { ImageIcon } from 'lucide-react';
import type { HeroSettings } from '@/types';
import { useStorefront } from './StorefrontContext';

// Banner principal personalizable: título, subtítulo, CTA e imagen de fondo.
export default function HeroSection({ settings }: { settings: HeroSettings }) {
  const { accent } = useStorefront();

  const hCls = settings.height === 'sm' ? 'min-h-[220px]' : settings.height === 'lg' ? 'min-h-[520px]' : 'min-h-[360px]';
  const alignCls =
    settings.text_align === 'center' ? 'items-center text-center' :
    settings.text_align === 'right'  ? 'items-end text-right' :
    'items-start text-left';
  const overlay = settings.overlay_opacity ?? 0.5;
  const vacio = !settings.heading && !settings.subheading && !settings.image && !settings.cta_text;

  return (
    <section className={`relative ${hCls} flex flex-col justify-center ${alignCls} px-6 md:px-12 py-12 overflow-hidden bg-[var(--nav-bg)]`}>
      {settings.image && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={settings.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black" style={{ opacity: overlay }} />
        </>
      )}

      {vacio ? (
        <div className="relative flex flex-col items-center text-white/40 gap-2">
          <ImageIcon className="w-8 h-8" />
          <span className="text-sm">Sección Hero — añade un título e imagen desde el panel</span>
        </div>
      ) : (
        <div className="relative max-w-3xl">
          {settings.heading && (
            <h2 className="text-3xl md:text-5xl font-black text-white mb-3" style={{ fontFamily: 'var(--font-display)' }}>{settings.heading}</h2>
          )}
          {settings.subheading && <p className="text-white/80 text-base md:text-lg mb-5">{settings.subheading}</p>}
          {settings.cta_text && (
            <Link href={settings.cta_link || '#'} className="inline-block font-bold text-white px-6 py-3 rounded-xl transition-transform hover:scale-105" style={{ background: accent }}>
              {settings.cta_text}
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
