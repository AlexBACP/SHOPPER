'use client';
import Link from 'next/link';
import type { AnnouncementSettings } from '@/types';
import { useStorefront } from './StorefrontContext';

// Barra de anuncio superior (full-width), con enlace opcional.
export default function AnnouncementSection({ settings }: { settings: AnnouncementSettings }) {
  const { accent } = useStorefront();

  if (!settings.text) {
    return (
      <div className="text-center py-2 px-4 text-xs border-b border-dashed border-[var(--line)] text-[var(--ink-soft)] bg-[var(--bone-3)]">
        Anuncio — escribe tu mensaje en el panel
      </div>
    );
  }

  const inner = <span className="text-sm font-medium">{settings.text}</span>;
  return (
    <div className="text-white text-center py-2 px-4" style={{ background: accent }}>
      {settings.link ? <Link href={settings.link} className="hover:underline">{inner}</Link> : inner}
    </div>
  );
}
