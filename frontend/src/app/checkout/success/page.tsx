'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, ShoppingBag, ArrowRight, Home } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useCartStore } from '@/store/cart.store';

type EstadoPago = 'cargando' | 'aprobado' | 'rechazado' | 'pendiente';

interface DatosOrden {
  id:     string;
  total:  number;
  status: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export default function PaginaExitoCheckout() {
  const params    = useSearchParams();
  const clearCart = useCartStore((s) => s.clearCart);

  const [estado, setEstado] = useState<EstadoPago>('cargando');
  const [orden,  setOrden]  = useState<DatosOrden | null>(null);

  useEffect(() => {
    const ref = params.get('ref');   // nuestro orderId
    if (!ref) { setEstado('rechazado'); return; }

    // Limpiar el carrito (ya fue procesado)
    clearCart();

    // Consultar el estado de la orden en nuestro backend
    const consultarOrden = async () => {
      try {
        const { data } = await api.get<DatosOrden>(`/orders/${ref}`);
        setOrden(data);

        if (data.status === 'confirmed' || data.status === 'pending') {
          setEstado('aprobado');
        } else if (data.status === 'cancelled') {
          setEstado('rechazado');
        } else {
          setEstado('pendiente');
        }
      } catch {
        // Si no podemos leer la orden igual mostramos éxito
        // (el webhook puede llegar con retraso)
        setEstado('aprobado');
      }
    };

    // Pequeño delay para que el webhook de Wompi actualice la orden
    const t = setTimeout(consultarOrden, 1200);
    return () => clearTimeout(t);
  }, [params, clearCart]);

  /* ── Pantalla de carga ── */
  if (estado === 'cargando') {
    return (
      <div className="min-h-screen bg-[var(--bg)]  flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-10 h-10 text-[var(--accent-bright)]" />
          </motion.div>
          <p className="text-[var(--text-secondary)] text-sm">Confirmando tu pago…</p>
        </div>
      </div>
    );
  }

  /* ── Pago rechazado ── */
  if (estado === 'rechazado') {
    return (
      <div className="min-h-screen bg-[var(--bg)]  flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-6 text-center max-w-sm"
        >
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
            className="w-20 h-20 bg-[var(--danger-subtle)] border border-[var(--danger-border)] rounded-3xl flex items-center justify-center"
          >
            <XCircle className="w-10 h-10 text-[var(--danger)]" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold mb-2">Pago no completado</h1>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
              El pago fue rechazado o cancelado. No se realizó ningún cobro.
              Puedes intentarlo de nuevo o elegir otro método de pago.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <Link href="/checkout"
              className="btn-shimmer w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold py-3 rounded-xl text-center transition-all">
              Intentar de nuevo
            </Link>
            <Link href="/cart"
              className="w-full bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] py-3 rounded-xl text-center transition-all text-sm">
              Volver al carrito
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── Pago aprobado / pendiente ── */
  return (
    <div className="min-h-screen bg-[var(--bg)]  flex items-center justify-center p-4">

      {/* Blobs decorativos */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-[var(--success)]/[0.04] blur-[120px] animar-float-suave" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-amber-500/[0.04] blur-[100px] animar-float" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center gap-6 text-center max-w-sm"
      >
        {/* Ícono de éxito con animación spring */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 18 }}
          className="w-24 h-24 bg-[var(--success)]/10 border border-[var(--success)]/25 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.15)]"
        >
          <CheckCircle2 className="w-12 h-12 text-[var(--success)]" />
        </motion.div>

        {/* Texto */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <h1 className="text-2xl font-bold mb-2">
            {estado === 'aprobado' ? '¡Pago exitoso!' : 'Pago en proceso'}
          </h1>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
            {estado === 'aprobado'
              ? 'Tu orden fue confirmada. El vendedor recibirá el pedido en breve.'
              : 'Tu pago está siendo procesado. Te notificaremos cuando sea confirmado.'}
          </p>

          {orden && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 flex flex-col gap-2"
            >
              <p className="text-[var(--text-muted)] text-xs font-mono bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 inline-block">
                Orden # {orden.id.slice(0, 8).toUpperCase()}
              </p>
              {orden.total > 0 && (
                <p className="text-lg font-bold texto-dorado">{fmt(orden.total)}</p>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Acciones */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="flex flex-col gap-3 w-full"
        >
          <Link href="/orders"
            className="btn-shimmer w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold py-3.5 rounded-xl text-center transition-all flex items-center justify-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Ver mis órdenes
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/"
            className="w-full bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] py-3 rounded-xl text-center transition-all text-sm flex items-center justify-center gap-2">
            <Home className="w-4 h-4" />
            Seguir comprando
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
