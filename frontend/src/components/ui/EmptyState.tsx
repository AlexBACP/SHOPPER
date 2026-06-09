'use client';

/**
 * EmptyState — estado vacío consistente para carrito, pedidos, lista de
 * deseos, búsqueda, etc. Mantiene un mismo lenguaje visual en toda la app.
 */

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, type LucideIcon } from 'lucide-react';

interface Props {
  icon:        LucideIcon;
  title:       string;
  description?: string;
  action?:     { href: string; label: string };
  /** Texto secundario opcional debajo del CTA. */
  children?:   React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action, children }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="text-center py-20 px-4"
    >
      <motion.div
        initial={{ scale: 0.85 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.05 }}
        className="w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center bg-[var(--bone-2)] border-2 border-dashed border-[var(--primary)]/30"
      >
        <Icon className="w-11 h-11 text-[var(--primary)]/60" />
      </motion.div>

      <h3 className="text-xl font-bold text-[var(--ink)] mb-2">{title}</h3>
      {description && (
        <p className="text-[var(--text-muted)] text-sm mb-7 max-w-sm mx-auto leading-relaxed">{description}</p>
      )}

      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center gap-2 bg-[var(--btn-cart-bg)] hover:bg-[var(--btn-cart-hover)] text-[var(--btn-cart-text)] font-bold px-7 py-3.5 rounded-xl transition-all hover:shadow-[var(--shadow-md)]"
        >
          {action.label} <ArrowRight className="w-4 h-4" />
        </Link>
      )}

      {children}
    </motion.div>
  );
}
