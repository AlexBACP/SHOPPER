'use client';
import { motion } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import type { FaqSettings } from '@/types';

// Preguntas frecuentes en acordeón (<details> nativo).
export default function FaqSection({ settings }: { settings: FaqSettings }) {
  const items = settings.items ?? [];

  return (
    <motion.div key="faq" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {settings.title && <h2 className="text-xl font-bold text-[var(--ink)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>{settings.title}</h2>}

      {items.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center text-[var(--text-muted)]">
          <HelpCircle className="w-10 h-10 mb-2 text-[var(--border-hover)]" />
          <p className="text-sm">Agrega preguntas y respuestas desde el panel</p>
        </div>
      ) : (
        <div className="max-w-2xl bg-[var(--bone-2)] border border-[var(--line)] rounded-xl px-5 shadow-[var(--shadow-sm)]">
          {items.map((it, i) => (
            <details key={i} className={`group py-3.5 ${i < items.length - 1 ? 'border-b border-[var(--line)]' : ''}`}>
              <summary className="flex items-center justify-between gap-3 cursor-pointer font-medium text-[var(--ink)] list-none">
                <span>{it.q}</span>
                <ChevronDown className="w-4 h-4 text-[var(--ink-soft)] group-open:rotate-180 transition-transform shrink-0" />
              </summary>
              <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">{it.a}</p>
            </details>
          ))}
        </div>
      )}
    </motion.div>
  );
}
