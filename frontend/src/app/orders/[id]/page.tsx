'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Package, MapPin, CreditCard, Clock,
  CheckCircle2, Truck, XCircle, RefreshCw, Loader2,
  Phone, Shield, Store, BadgeCheck, Copy, Check,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import api from '@/lib/api';

const fmt     = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });

const ESTADOS: Record<string, { label:string; color:string; bg:string; icon:React.ElementType; desc:string }> = {
  pending:    { label:'Pendiente',   color:'text-yellow-700', bg:'bg-yellow-50  border-yellow-200', icon:Clock,        desc:'Tu pedido está siendo revisado por el vendedor.' },
  confirmed:  { label:'Confirmado',  color:'text-blue-700',   bg:'bg-blue-50    border-blue-200',   icon:CheckCircle2, desc:'El vendedor confirmó tu pedido y lo está preparando.' },
  processing: { label:'Preparando',  color:'text-purple-700', bg:'bg-purple-50  border-purple-200', icon:RefreshCw,    desc:'Tu pedido está siendo empacado y preparado para envío.' },
  shipped:    { label:'En camino',   color:'text-cyan-700',   bg:'bg-cyan-50    border-cyan-200',   icon:Truck,        desc:'Tu pedido fue enviado y está en camino a tu dirección.' },
  delivered:  { label:'Entregado',   color:'text-green-700',  bg:'bg-green-50   border-green-200',  icon:CheckCircle2, desc:'Tu pedido fue entregado exitosamente. ¡Disfrútalo!' },
  cancelled:  { label:'Cancelado',   color:'text-red-700',    bg:'bg-red-50     border-red-200',    icon:XCircle,      desc:'Este pedido fue cancelado.' },
  refunded:   { label:'Reembolsado', color:'text-gray-700',   bg:'bg-gray-50    border-gray-200',   icon:RefreshCw,    desc:'El reembolso fue procesado exitosamente.' },
};

const FLUJO = ['pending','confirmed','processing','shipped','delivered'];

const PAGOS: Record<string,string> = {
  pse:'PSE — Débito bancario', nequi:'Nequi', daviplata:'Daviplata', card:'Tarjeta crédito/débito',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [pedido,  setPedido]  = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(r => setPedido(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const copiarId = () => {
    navigator.clipboard?.writeText(`#${id?.slice(-8)?.toUpperCase()}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
    </div>
  );

  if (!pedido) return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
      <div className="text-center">
        <Package className="w-14 h-14 text-[var(--border-hover)] mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Pedido no encontrado</h2>
        <Link href="/orders" className="text-[var(--blue)] hover:underline text-sm">Ver todos mis pedidos</Link>
      </div>
    </div>
  );

  const estado    = ESTADOS[pedido.status] ?? ESTADOS.pending;
  const IconoE    = estado.icon;
  const idxActual = FLUJO.indexOf(pedido.status);
  const esCancelado = pedido.status === 'cancelled' || pedido.status === 'refunded';

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Header */}
      <div className="bg-[var(--nav-bg)] px-4 md:px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/orders" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-5 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Mis pedidos
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-white">Pedido</h1>
                <button onClick={copiarId}
                  className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm font-mono">
                  #{id?.slice(-8)?.toUpperCase()}
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-white/50 text-sm">{fmtDate(pedido.created_at)}</p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold ${estado.bg} ${estado.color}`}>
              <IconoE className="w-4 h-4" />
              {estado.label}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

        {/* Columna principal */}
        <div className="space-y-5">

          {/* Timeline de estados */}
          {!esCancelado && (
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
              className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-sm">
              <h2 className="font-bold text-[var(--text-primary)] mb-5 flex items-center gap-2">
                <Truck className="w-5 h-5 text-[var(--accent)]" /> Seguimiento del pedido
              </h2>
              <div className="flex items-center gap-0 overflow-x-auto pb-2">
                {FLUJO.map((step, i) => {
                  const e    = ESTADOS[step];
                  const done = idxActual > i;
                  const curr = idxActual === i;
                  const Icon = e.icon;
                  return (
                    <div key={step} className="flex items-center flex-1 min-w-0">
                      <div className="flex flex-col items-center gap-1.5 shrink-0">
                        <motion.div
                          initial={{ scale: 0.8 }}
                          animate={{ scale: curr ? [1, 1.1, 1] : 1 }}
                          transition={{ repeat: curr ? Infinity : 0, duration: 2 }}
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                            done ? 'bg-green-500 border-green-500' :
                            curr ? 'bg-[var(--accent)] border-[var(--accent)] shadow-lg shadow-orange-200/60' :
                            'bg-white border-[var(--border)]'
                          }`}>
                          <Icon className={`w-4 h-4 ${done||curr ? 'text-white' : 'text-[var(--text-muted)]'}`} />
                        </motion.div>
                        <span className={`text-[10px] font-semibold text-center leading-tight w-14 ${curr ? 'text-[var(--accent-dark)]' : done ? 'text-green-700' : 'text-[var(--text-muted)]'}`}>
                          {e.label}
                        </span>
                      </div>
                      {i < FLUJO.length - 1 && (
                        <div className="flex-1 h-0.5 mx-1 transition-all" style={{ background: done ? '#22c55e' : '#e2e5e9' }} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className={`mt-4 p-3 rounded-xl border text-sm ${estado.bg} ${estado.color}`}>
                <p className="font-medium">{estado.desc}</p>
              </div>
            </motion.div>
          )}

          {/* Productos */}
          <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
            className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--surface-2)] flex items-center gap-2">
              <Package className="w-4 h-4 text-[var(--accent)]" />
              <h2 className="font-bold text-[var(--text-primary)] text-sm">Artículos ({pedido.items?.length ?? 0})</h2>
            </div>
            {pedido.items?.map((it: any, i: number) => (
              <div key={i} className={`flex items-center gap-4 px-5 py-4 ${i < pedido.items.length - 1 ? 'border-b border-[var(--border)]' : ''}`}>
                <div className="w-14 h-14 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                  <Package className="w-6 h-6 text-[var(--text-muted)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{it.title}</p>
                  <p className="text-xs text-[var(--text-muted)]">SKU: {it.sku} · Cant: {it.quantity}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-[var(--text-primary)]">{fmt(it.price * it.quantity)}</p>
                  <p className="text-xs text-[var(--text-muted)]">{fmt(it.price)} c/u</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Envío */}
          {pedido.shipping_name && (
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
              className="bg-white border border-[var(--border)] rounded-2xl p-5 shadow-sm">
              <h2 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-[var(--accent)]" /> Dirección de envío
              </h2>
              <div className="text-sm text-[var(--text-secondary)] space-y-1">
                <p className="font-semibold text-[var(--text-primary)]">{pedido.shipping_name}</p>
                {pedido.shipping_phone && <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[var(--text-muted)]"/>{pedido.shipping_phone}</p>}
                <p>{pedido.shipping_address}</p>
                <p>{pedido.shipping_city}{pedido.shipping_dept ? `, ${pedido.shipping_dept}` : ''}</p>
                {pedido.shipping_notes && <p className="text-[var(--text-muted)] italic">"{pedido.shipping_notes}"</p>}
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar resumen */}
        <div className="space-y-4">
          {/* Resumen financiero */}
          <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
            className="bg-white border border-[var(--border)] rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-[var(--text-primary)] mb-4 text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[var(--accent)]" /> Resumen de pago
            </h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Subtotal</span>
                <span>{fmt(pedido.subtotal ?? pedido.total * 0.84)}</span>
              </div>
              {(pedido.discount_amount ?? 0) > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Descuento</span><span>−{fmt(pedido.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>IVA (19%)</span>
                <span>{fmt(pedido.iva_amount ?? pedido.total * 0.16)}</span>
              </div>
              <div className="h-px bg-[var(--border)] my-1" />
              <div className="flex justify-between font-black text-base text-[var(--text-primary)]">
                <span>Total pagado</span><span className="text-[var(--accent-dark)]">{fmt(pedido.total)}</span>
              </div>
            </div>
            {pedido.payment_method && (
              <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <CreditCard className="w-3.5 h-3.5 shrink-0" />
                {PAGOS[pedido.payment_method] ?? pedido.payment_method}
              </div>
            )}
          </motion.div>

          {/* Garantías */}
          <div className="bg-white border border-[var(--border)] rounded-2xl p-4 shadow-sm space-y-3">
            {[
              { icon: Shield,    text:'Compra protegida',   sub:'SSL 256-bit verificado' },
              { icon: BadgeCheck,text:'Vendedor verificado', sub:'Identidad confirmada' },
            ].map(({ icon:Icon, text, sub }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-[var(--text-primary)]">{text}</p>
                  <p className="text-[var(--text-muted)]">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          <Link href="/orders"
            className="flex items-center justify-center gap-2 w-full py-3 border border-[var(--border)] rounded-xl text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" /> Todos mis pedidos
          </Link>
        </div>
      </div>
    </div>
  );
}
