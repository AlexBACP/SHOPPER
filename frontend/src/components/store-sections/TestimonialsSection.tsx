'use client';
import { motion } from 'framer-motion';
import { Star, MessageSquareQuote } from 'lucide-react';
import type { TestimonialsSettings } from '@/types';

// Testimonios de clientes: rejilla de tarjetas con estrellas.
export default function TestimonialsSection({ settings }: { settings: TestimonialsSettings }) {
  const items = settings.items ?? [];

  return (
    <motion.div key="testimonials" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {settings.title && <h2 className="text-xl font-bold text-[var(--ink)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>{settings.title}</h2>}

      {items.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center text-[var(--text-muted)]">
          <MessageSquareQuote className="w-10 h-10 mb-2 text-[var(--border-hover)]" />
          <p className="text-sm">Agrega testimonios desde el panel</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((t, i) => (
            <div key={i} className="bg-[var(--bone-2)] border border-[var(--line)] rounded-xl p-5 shadow-[var(--shadow-sm)]">
              {typeof t.rating === 'number' && (
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className={`w-4 h-4 ${s < t.rating! ? 'fill-[var(--primary)] text-[var(--primary)]' : 'text-[var(--border-hover)]'}`} />
                  ))}
                </div>
              )}
              <p className="text-sm text-[var(--text-secondary)] mb-3 leading-relaxed">“{t.text}”</p>
              <p className="text-sm font-bold text-[var(--ink)]">{t.name}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
