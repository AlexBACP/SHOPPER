'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, ShoppingBag, ArrowRight, Home } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useCartStore } from '@/store/cart.store';

type EstadoPago = 'cargando' | 'aprobado' | 'rechazado' | 'pendiente';

interface DatosOrden {
  id:     string;
  total:  number;
  status: string;
  payment_method?: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

function ContenidoExitoCheckout() {
  const params    = useSearchParams();
  const clearCart = useCartStore((s) => s.clearCart);

  const [estado, setEstado] = useState<EstadoPago>('cargando');
  const [orden,  setOrden]  = useState<DatosOrden | null>(null);

  useEffect(() => {
    const ref = params.get('ref');   // nuestro orderId
    if (!ref) { setEstado('rechazado'); return; }

    // Limpiar el carrito (ya fue procesado)
    clearCart();

    // Aviso si el cupón se descartó entre el carrito y el checkout
    if (params.get('coupon_dropped') === '1') {
      toast.warning('El cupón ya no era válido. Tu pedido se procesó sin descuento.', { duration: 6000 });
    }

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

  // ── Pago contra entrega + coordinar por WhatsApp ──
  const esContraEntrega = params.get('method') === 'cod' || orden?.payment_method === 'cod';
  const waPedido = orden
    ? `https://wa.me/?text=${encodeURIComponent(
        `¡Hola! Acabo de hacer un pedido en Shopper.\n\n*Pedido:* #${orden.id.slice(0, 8).toUpperCase()}\n*Total:* ${fmt(orden.total)}\n*Pago:* ${esContraEntrega ? 'Contra entrega (efectivo al recibir)' : 'Pagado en línea'}\n\n¿Me confirmas la entrega? ¡Gracias!`,
      )}`
    : '';

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
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-[var(--primary)]/[0.04] blur-[100px] animar-float" style={{ animationDelay: '2s' }} />
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
          className="w-24 h-24 bg-[var(--success)]/10 border border-[var(--success)]/25 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(47,93,79,0.15)]"
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
            {esContraEntrega ? '¡Pedido confirmado!' : estado === 'aprobado' ? '¡Pago exitoso!' : 'Pago en proceso'}
          </h1>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
            {esContraEntrega
              ? 'Pagarás en efectivo al recibir tu pedido. El vendedor coordinará la entrega contigo — confírmasela por WhatsApp'
              : estado === 'aprobado'
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
          {orden && (
            <a href={waPedido} target="_blank" rel="noopener noreferrer"
              className="w-full bg-[#25D366] hover:bg-[#1da851] text-white font-bold py-3.5 rounded-xl text-center transition-all flex items-center justify-center gap-2 shadow-md">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.559 4.118 1.535 5.845L.057 23.99l6.345-1.663A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.956 0-3.77-.592-5.27-1.607l-.378-.226-3.916 1.026 1.043-3.82-.247-.393A9.961 9.961 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
              Coordinar entrega por WhatsApp
            </a>
          )}
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

export default function PaginaExitoCheckout() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg)] flex items-center justify-center"><Loader2 className="w-10 h-10 text-[var(--accent-bright)] animate-spin" /></div>}>
      <ContenidoExitoCheckout />
    </Suspense>
  );
}
