'use client';
import { Mail, MessageCircle } from 'lucide-react';
import type { ContactSettings } from '@/types';
import { useStorefront } from './StorefrontContext';

// CTA de contacto (zona inferior): WhatsApp + email.
export default function ContactSection({ settings }: { settings: ContactSettings }) {
  const { accent, tienda } = useStorefront();
  const wa = (settings.whatsapp ?? '').replace(/[^\d]/g, '');
  const waLink = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(`¡Hola! Vengo de tu tienda ${tienda.name} en Shopper.`)}` : null;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pb-12">
      <div className="bg-[var(--bone-2)] border border-[var(--line)] rounded-2xl p-8 text-center shadow-[var(--shadow-sm)]">
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>{settings.title || 'Contáctanos'}</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-5">¿Tienes preguntas? Escríbenos.</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {waLink && (
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#1da851] text-white rounded-xl text-sm font-semibold transition-all shadow-md">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          )}
          {settings.email && (
            <a href={`mailto:${settings.email}`}
              className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold transition-all shadow-md" style={{ background: accent }}>
              <Mail className="w-4 h-4" /> {settings.email}
            </a>
          )}
          {!waLink && !settings.email && (
            <p className="text-sm text-[var(--text-muted)]">Añade tu WhatsApp o email desde el panel</p>
          )}
        </div>
      </div>
    </div>
  );
}
