'use client';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { FooterSettings } from '@/types';

// Pie del escaparate: enlace para volver al inicio.
export default function FooterSection({ settings }: { settings: FooterSettings }) {
  if (settings.show_back_link === false) return null;
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pb-10">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--ink-soft)] hover:text-[var(--primary)] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver al inicio
      </Link>
    </div>
  );
}
