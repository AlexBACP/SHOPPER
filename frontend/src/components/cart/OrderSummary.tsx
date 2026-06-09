'use client';
import { motion } from 'framer-motion';
import { Tag, Truck } from 'lucide-react';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

interface OrderSummaryProps {
  itemCount:       number;
  /** Bruto: suma de precios de los productos (IVA ya incluido). */
  subtotal:        number;
  /** Porcentaje de descuento aplicado (para la etiqueta). */
  discountPct?:    number;
  /** Monto del descuento en pesos. */
  discountAmount?: number;
  /** IVA contenido dentro del precio (informativo, no se suma). */
  ivaIncluded:     number;
  /**
   * Envío: `undefined` no muestra la línea, `'pending'` muestra "A calcular",
   * `0` muestra "Gratis", y un número positivo muestra el monto.
   */
  shipping?:       number | 'pending';
  className?:      string;
}

/**
 * Resumen de pedido reutilizable (carrito, checkout, mini-cart).
 * Los precios en Shopper YA incluyen IVA, por eso el IVA se muestra como
 * línea informativa y nunca se suma al total.
 */
export default function OrderSummary({
  itemCount, subtotal, discountPct = 0, discountAmount = 0, ivaIncluded, shipping, className = '',
}: OrderSummaryProps) {
  const shippingCost = typeof shipping === 'number' ? shipping : 0;
  const total        = subtotal - discountAmount + shippingCost;

  return (
    <div className={`space-y-2.5 text-sm ${className}`}>
      <div className="flex justify-between text-[var(--text-secondary)]">
        <span>Subtotal ({itemCount} art.)</span>
        <span>{fmt(subtotal)}</span>
      </div>

      {discountAmount > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex justify-between text-[var(--selva)] font-semibold">
          <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" />Descuento ({discountPct}%)</span>
          <span>−{fmt(discountAmount)}</span>
        </motion.div>
      )}

      {/* IVA contenido en el precio — informativo, no se suma. */}
      <div className="flex justify-between text-[var(--text-muted)]">
        <span className="flex items-center gap-1">
          IVA incluido (19%)
          <span className="text-[10px] bg-[var(--surface-2)] px-1.5 py-0.5 rounded-full ml-1">Colombia</span>
        </span>
        <span>{fmt(ivaIncluded)}</span>
      </div>

      {shipping !== undefined && (
        <div className="flex justify-between text-[var(--text-secondary)]">
          <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" />Envío</span>
          {shipping === 'pending'
            ? <span className="text-[var(--text-muted)]">A calcular</span>
            : shippingCost === 0
              ? <span className="text-[var(--success)] font-semibold">Gratis</span>
              : <span>{fmt(shippingCost)}</span>}
        </div>
      )}

      <div className="h-px bg-[var(--border)] !my-3" />

      <div className="flex justify-between font-black text-lg text-[var(--ink)]">
        <span>Total a pagar</span>
        <motion.span key={total} initial={{ scale: 1.05 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }}>
          {fmt(total)}
        </motion.span>
      </div>

      <p className="text-[10px] text-[var(--text-muted)]">Los precios incluyen IVA del 19% (legislación colombiana).</p>
    </div>
  );
}
