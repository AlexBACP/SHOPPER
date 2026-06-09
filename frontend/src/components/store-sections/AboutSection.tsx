'use client';
import { motion } from 'framer-motion';
import { Package, BadgeCheck } from 'lucide-react';
import type { AboutSettings } from '@/types';
import { useStorefront } from './StorefrontContext';

// Pestaña "Información": resumen de la tienda + sellos de confianza.
export default function AboutSection({ settings }: { settings: AboutSettings }) {
  const { tienda, productos } = useStorefront();
  const titulo = settings.title || `Sobre ${tienda.name}`;
  const cuerpo = settings.body || tienda.description || 'Esta tienda no tiene descripción.';

  return (
    <motion.div key="info" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <div className="max-w-2xl bg-[var(--bone-2)] border border-[var(--line)] rounded-xl p-6 shadow-[var(--shadow-sm)]">
        <h2 className="font-bold text-lg text-[var(--text-primary)] mb-4">{titulo}</h2>
        <p className="text-[var(--text-secondary)] mb-6">{cuerpo}</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-3 p-3 bg-[var(--surface-2)] rounded-lg"><BadgeCheck className="w-5 h-5 text-green-600 shrink-0"/><div><p className="font-medium">Verificada</p><p className="text-xs text-[var(--text-muted)]">Identidad confirmada</p></div></div>
          <div className="flex items-center gap-3 p-3 bg-[var(--surface-2)] rounded-lg"><Package className="w-5 h-5 text-[var(--accent)] shrink-0"/><div><p className="font-medium">{productos.length} productos</p><p className="text-xs text-[var(--text-muted)]">Disponibles</p></div></div>
        </div>
      </div>
    </motion.div>
  );
}
