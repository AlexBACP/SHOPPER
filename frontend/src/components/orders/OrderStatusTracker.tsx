'use client';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, RefreshCw, Truck } from 'lucide-react';

/** Flujo normal de un pedido (P1.6). */
const FLUJO = [
  { key: 'pending',    label: 'Pendiente',  Icon: Clock        },
  { key: 'confirmed',  label: 'Confirmado', Icon: CheckCircle2 },
  { key: 'processing', label: 'Preparando', Icon: RefreshCw    },
  { key: 'shipped',    label: 'En camino',  Icon: Truck        },
  { key: 'delivered',  label: 'Entregado',  Icon: CheckCircle2 },
] as const;

const ORDEN = FLUJO.map(f => f.key) as readonly string[];

interface OrderStatusTrackerProps {
  status: string;
  /** `compact` muestra solo los puntos (para listas); `full` incluye etiquetas. */
  compact?: boolean;
  className?: string;
}

/**
 * Stepper horizontal del estado de un pedido. Si el estado es cancelado o
 * reembolsado no se muestra (esos no pertenecen al flujo lineal).
 */
export default function OrderStatusTracker({ status, compact = false, className = '' }: OrderStatusTrackerProps) {
  if (status === 'cancelled' || status === 'refunded') return null;

  const idxActual = ORDEN.indexOf(status);

  if (compact) {
    return (
      <div className={`flex items-center gap-1 ${className}`} aria-label={`Estado: ${FLUJO[Math.max(0, idxActual)]?.label}`}>
        {FLUJO.map((step, i) => {
          const done = idxActual >= i;
          return (
            <div key={step.key} className="flex items-center gap-1 flex-1">
              <span
                className="w-2 h-2 rounded-full shrink-0 transition-colors"
                style={{ background: done ? 'var(--selva)' : 'var(--line)' }}
              />
              {i < FLUJO.length - 1 && (
                <span className="flex-1 h-0.5 rounded-full" style={{ background: idxActual > i ? 'var(--selva)' : 'var(--line)' }} />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-0 overflow-x-auto pb-2 ${className}`}>
      {FLUJO.map((step, i) => {
        const done = idxActual > i;
        const curr = idxActual === i;
        const { Icon } = step;
        return (
          <div key={step.key} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: curr ? [1, 1.1, 1] : 1 }}
                transition={{ repeat: curr ? Infinity : 0, duration: 2 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  done ? 'bg-[var(--selva)] border-[var(--selva)]' :
                  curr ? 'bg-[var(--primary)] border-[var(--primary)]' :
                  'bg-[var(--bone-2)] border-[var(--line)]'
                }`}
              >
                <Icon className={`w-4 h-4 ${done || curr ? 'text-white' : 'text-[var(--text-muted)]'}`} />
              </motion.div>
              <span className={`text-[10px] font-semibold text-center leading-tight w-14 ${
                curr ? 'text-[var(--primary-2)]' : done ? 'text-[var(--selva)]' : 'text-[var(--ink-soft)]'
              }`}>
                {step.label}
              </span>
            </div>
            {i < FLUJO.length - 1 && (
              <div className="flex-1 h-0.5 mx-1 transition-all" style={{ background: done ? 'var(--selva)' : 'var(--line)' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
