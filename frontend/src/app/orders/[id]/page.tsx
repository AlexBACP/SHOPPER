'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Package, MapPin, CreditCard, Clock, CheckCircle2, Truck, XCircle, RefreshCw, Loader2, Phone, Shield, BadgeCheck, Copy, Check, ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { trackingUrl, carrierName } from '@/lib/shipping';
import OrderStatusTracker from '@/components/orders/OrderStatusTracker';
import BotonFacturaDIAN from '@/components/invoice/BotonFacturaDIAN';

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

const PAGOS: Record<string,string> = {
  pse:'PSE — Débito bancario', nequi:'Nequi', daviplata:'Daviplata', card:'Tarjeta crédito/débito',
  cod:'Pago contra entrega (efectivo)',
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
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">Pedido no encontrado</h2>
        <Link href="/orders" className="text-[var(--selva)] hover:underline text-sm">Ver todos mis pedidos</Link>
      </div>
    </div>
  );

  const estado    = ESTADOS[pedido.status] ?? ESTADOS.pending;
  const IconoE    = estado.icon;
  const esCancelado = pedido.status === 'cancelled' || pedido.status === 'refunded';

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Header */}
      <div className="bg-[var(--bone-2)] border-b border-[var(--line)] px-4 md:px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/orders" className="inline-flex items-center gap-2 text-[var(--ink-soft)] hover:text-[var(--ink)] text-sm mb-5 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Mis pedidos
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-[var(--ink)]">Pedido</h1>
                <button onClick={copiarId}
                  className="flex items-center gap-1.5 text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors text-sm font-mono">
                  #{id?.slice(-8)?.toUpperCase()}
                  {copied ? <Check className="w-3.5 h-3.5 text-[var(--selva)]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[var(--ink-soft)] text-sm">{fmtDate(pedido.created_at)}</p>
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
              className="bg-[var(--bone-2)] border border-[var(--line)] rounded-2xl p-6 shadow-[var(--shadow-sm)]">
              <h2 className="font-bold text-[var(--ink)] mb-5 flex items-center gap-2">
                <Truck className="w-5 h-5 text-[var(--accent)]" /> Seguimiento del pedido
              </h2>
              <OrderStatusTracker status={pedido.status} />
              <div className={`mt-4 p-3 rounded-xl border text-sm ${estado.bg} ${estado.color}`}>
                <p className="font-medium">{estado.desc}</p>
              </div>
            </motion.div>
          )}

          {/* Rastreo del envío */}
          {pedido.carrier && (
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.08 }}
              className="bg-cyan-50 border border-cyan-200 rounded-2xl p-5 shadow-[var(--shadow-sm)]">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5 text-cyan-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-cyan-900">Tu pedido va con {carrierName(pedido.carrier)}</p>
                  <p className="text-sm text-cyan-700">Guía N° <span className="font-mono font-semibold">{pedido.tracking_number}</span></p>
                  {trackingUrl(pedido.carrier, pedido.tracking_number) && (
                    <a href={trackingUrl(pedido.carrier, pedido.tracking_number)!} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 text-sm font-bold text-cyan-800 hover:underline">
                      Rastrear envío <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Productos */}
          <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
            className="bg-[var(--bone-2)] border border-[var(--line)] rounded-2xl overflow-hidden shadow-[var(--shadow-sm)]">
            <div className="px-5 py-4 border-b border-[var(--line)] bg-[var(--bone-3)] flex items-center gap-2">
              <Package className="w-4 h-4 text-[var(--accent)]" />
              <h2 className="font-bold text-[var(--ink)] text-sm">Artículos ({pedido.items?.length ?? 0})</h2>
            </div>
            {pedido.items?.map((it: any, i: number) => (
              <div key={i} className={`flex items-center gap-4 px-5 py-4 ${i < pedido.items.length - 1 ? 'border-b border-[var(--border)]' : ''}`}>
                <div className="w-14 h-14 bg-[var(--bone-3)] border border-[var(--line)] rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                  <Package className="w-6 h-6 text-[var(--text-muted)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--ink)] truncate">{it.title}</p>
                  <p className="text-xs text-[var(--text-muted)]">SKU: {it.sku} · Cant: {it.quantity}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-[var(--ink)]">{fmt(it.price * it.quantity)}</p>
                  <p className="text-xs text-[var(--text-muted)]">{fmt(it.price)} c/u</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Envío */}
          {pedido.shipping_name && (
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
              className="bg-[var(--bone-2)] border border-[var(--line)] rounded-2xl p-5 shadow-[var(--shadow-sm)]">
              <h2 className="font-bold text-[var(--ink)] mb-4 flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-[var(--accent)]" /> Dirección de envío
              </h2>
              <div className="text-sm text-[var(--text-secondary)] space-y-1">
                <p className="font-semibold text-[var(--ink)]">{pedido.shipping_name}</p>
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
            className="bg-[var(--bone-2)] border border-[var(--line)] rounded-2xl p-5 shadow-[var(--shadow-sm)]">
            <h2 className="font-bold text-[var(--ink)] mb-4 text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[var(--accent)]" /> Resumen de pago
            </h2>
            {(() => {
              // El backend no guarda subtotal/IVA por separado; los estimamos
              // descontando primero el envío del total para mayor precisión.
              const envio  = Number(pedido.shipping_cost ?? 0);
              const bienes = Number(pedido.total) - envio;
              const subtotalEst = pedido.subtotal ?? bienes / 1.19;
              const ivaEst      = pedido.iva_amount ?? bienes - subtotalEst;
              return (
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Subtotal</span>
                    <span>{fmt(subtotalEst)}</span>
                  </div>
                  {(pedido.discount_amount ?? 0) > 0 && (
                    <div className="flex justify-between text-[var(--selva)] font-medium">
                      <span>Descuento</span><span>−{fmt(pedido.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[var(--text-muted)]">
                    <span>IVA incluido (19%)</span>
                    <span>{fmt(ivaEst)}</span>
                  </div>
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Envío</span>
                    {envio === 0
                      ? <span className="text-[var(--selva)] font-semibold">Gratis</span>
                      : <span>{fmt(envio)}</span>}
                  </div>
                  <div className="h-px bg-[var(--border)] my-1" />
                  <div className="flex justify-between font-black text-base text-[var(--ink)]">
                    <span>Total pagado</span><span className="text-[var(--accent-dark)]">{fmt(pedido.total)}</span>
                  </div>
                </div>
              );
            })()}
            {pedido.payment_method && (
              <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <CreditCard className="w-3.5 h-3.5 shrink-0" />
                {PAGOS[pedido.payment_method] ?? pedido.payment_method}
              </div>
            )}

            {/* Factura electrónica (académica) — PDF + Excel sin servicio DIAN */}
            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--ink-soft)] mb-2.5 font-medium">
                Factura electrónica
              </p>
              <BotonFacturaDIAN pedido={pedido} formats="both" />
              <p className="text-[10px] text-[var(--text-muted)] mt-2 leading-snug">
                Documento académico — incluye CUFE simulado, IVA 19% por ítem y
                resumen de impuestos. No reportado a DIAN.
              </p>
            </div>
          </motion.div>

          {/* Garantías */}
          <div className="bg-[var(--bone-2)] border border-[var(--line)] rounded-2xl p-4 shadow-[var(--shadow-sm)] space-y-3">
            {[
              { icon: Shield,    text:'Compra protegida',   sub:'SSL 256-bit verificado' },
              { icon: BadgeCheck,text:'Vendedor verificado', sub:'Identidad confirmada' },
            ].map(({ icon:Icon, text, sub }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[var(--selva-soft)] border border-[var(--selva)]/30 rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-[var(--selva)]" />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-[var(--ink)]">{text}</p>
                  <p className="text-[var(--text-muted)]">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          <Link href="/orders"
            className="flex items-center justify-center gap-2 w-full py-3 border border-[var(--line)] rounded-full text-sm text-[var(--ink-soft)] hover:bg-[var(--bone-3)] transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" /> Todos mis pedidos
          </Link>
        </div>
      </div>
    </div>
  );
}
