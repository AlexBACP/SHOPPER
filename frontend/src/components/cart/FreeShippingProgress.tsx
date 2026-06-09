'use client';
import { motion } from 'framer-motion';
import { Truck, PartyPopper } from 'lucide-react';
import { FREE_SHIPPING_THRESHOLD } from '@/config/constants';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

interface FreeShippingProgressProps {
  /** Subtotal actual del carrito (con IVA incluido). */
  subtotal:  number;
  /** Umbral de envío gratis; por defecto el de configuración. */
  threshold?: number;
  /** `compact` para el mini-cart; `default` para páginas. */
  size?:     'compact' | 'default';
  className?: string;
}

/**
 * Barra de progreso hacia el envío gratis. Muestra cuánto falta y, al
 * alcanzar el umbral, un mensaje de felicitación. P1.2 del README de mejoras.
 */
export default function FreeShippingProgress({
  subtotal, threshold = FREE_SHIPPING_THRESHOLD, size = 'default', className = '',
}: FreeShippingProgressProps) {
  const calificado = subtotal >= threshold;
  const restante   = Math.max(0, threshold - subtotal);
  const pct        = Math.min(100, Math.round((subtotal / threshold) * 100));

  const padding = size === 'compact' ? 'p-3' : 'p-4';
  const text    = size === 'compact' ? 'text-xs' : 'text-base md:text-lg';

  return (
    <div
      className={`rounded-2xl border ${padding} ${className}`}
      style={{
        background: calificado ? 'var(--success-subtle, var(--selva-soft))' : 'var(--surface-2)',
        borderColor: calificado ? 'var(--success-border, var(--selva))' : 'var(--line)',
      }}
      role="status"
      aria-live="polite"
    >
      <div className={`flex items-center gap-2 font-bold text-[var(--ink)] ${text}`}>
        {calificado ? (
          <>
            <PartyPopper className="w-5 h-5 text-[var(--selva)] shrink-0" />
            <span>¡Tu pedido tiene envío <span className="text-[var(--selva)]">GRATIS</span>!</span>
          </>
        ) : (
          <>
            <Truck className="w-5 h-5 text-[var(--primary)] shrink-0" />
            <span>Te faltan <span className="text-[var(--primary)]">{fmt(restante)}</span> para envío GRATIS</span>
          </>
        )}
      </div>

      <div className="mt-2.5 h-2.5 rounded-full bg-[var(--surface-3,var(--line))] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: calificado ? 'var(--selva)' : 'var(--primary)' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
