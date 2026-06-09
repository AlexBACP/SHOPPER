'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Package, Clock, CheckCircle, Truck, XCircle, RefreshCw, ChevronDown, ChevronUp, Loader2,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

const ESTADO: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:    { label: 'Pendiente',   color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock        },
  confirmed:  { label: 'Confirmado',  color: 'bg-blue-100 text-blue-700 border-blue-200',       icon: CheckCircle  },
  processing: { label: 'Preparando',  color: 'bg-purple-100 text-purple-700 border-purple-200', icon: RefreshCw    },
  shipped:    { label: 'Enviado',     color: 'bg-cyan-100 text-cyan-700 border-cyan-200',       icon: Truck        },
  delivered:  { label: 'Entregado',   color: 'bg-green-100 text-green-700 border-green-200',   icon: CheckCircle  },
  cancelled:  { label: 'Cancelado',   color: 'bg-red-100 text-red-700 border-red-200',         icon: XCircle      },
  refunded:   { label: 'Reembolsado', color: 'bg-gray-100 text-gray-600 border-gray-200',      icon: RefreshCw    },
};

export default function OrdersPage() {
  const { user } = useAuthStore();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [expandido, setExpandido] = useState<string | null>(null);

  useEffect(() => {
    api.get('/orders/my').then(r => setPedidos(r.data ?? [])).catch(() => {}).finally(() => setCargando(false));
  }, []);

  if (!user) return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="bg-[var(--bone-2)] border-b border-[var(--line)] py-8 px-4 md:px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 bg-[var(--primary)] rounded-xl flex items-center justify-center shadow-[var(--shadow-sm)]">
            <ShoppingBag className="w-6 h-6 text-[var(--bone-2)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--ink)]">Mis pedidos</h1>
            <p className="text-[var(--ink-soft)] text-sm">{pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} en total</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        {cargando ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}</div>
        ) : pedidos.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
            <div className="w-20 h-20 bg-[var(--bone-2)] border border-[var(--line)] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[var(--shadow-sm)]">
              <Package className="w-9 h-9 text-[var(--border-hover)]" />
            </div>
            <h3 className="text-lg font-bold text-[var(--ink)] mb-2">Sin pedidos aún</h3>
            <p className="text-[var(--text-muted)] text-sm mb-6">Explora nuestras tiendas y haz tu primera compra</p>
            <Link href="/" className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold px-6 py-3 rounded-lg transition-all hover:shadow-md">
              Explorar tiendas
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {pedidos.map((pedido, i) => {
              const estado = ESTADO[pedido.status] ?? ESTADO.pending;
              const IconoEstado = estado.icon;
              const abierto = expandido === pedido.id;

              return (
                <motion.div key={pedido.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-[var(--bone-2)] border border-[var(--line)] rounded-xl overflow-hidden shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all">
                  {/* Header del pedido */}
                  <div className="flex items-center gap-4 px-5 py-4 cursor-pointer" onClick={() => setExpandido(abierto ? null : pedido.id)}>
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${estado.color.replace('text-','').replace('bg-','bg-').replace('border-','')}`}>
                      <IconoEstado className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-[var(--ink)] truncate">Pedido #{pedido.id?.slice(-8)?.toUpperCase()}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${estado.color}`}>{estado.label}</span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">{fmtDate(pedido.created_at)} · {pedido.items?.length ?? 0} artículo{(pedido.items?.length ?? 0) !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-black text-[var(--ink)]">{fmt(pedido.total)}</p>
                      <p className="text-xs text-[var(--text-muted)]">{pedido.shipping_city}</p>
                    </div>
                    {abierto ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)] shrink-0" />}
                  </div>

                  {/* Detalle expandido */}
                  <AnimatePresence>
                    {abierto && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="border-t border-[var(--line)] px-5 py-4 bg-[var(--bone-3)]">
                          {pedido.items?.map((item: any, j: number) => (
                            <div key={item.id ?? j} className="flex items-center gap-3 py-2">
                              <div className="w-10 h-10 bg-[var(--bone-2)] border border-[var(--line)] rounded-lg flex items-center justify-center shrink-0">
                                <Package className="w-4 h-4 text-[var(--text-muted)]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{item.title}</p>
                                <p className="text-xs text-[var(--text-muted)]">x{item.quantity}</p>
                              </div>
                              <p className="text-sm font-bold text-[var(--accent-dark)] shrink-0">{fmt(item.price * item.quantity)}</p>
                            </div>
                          ))}
                          {pedido.shipping_name && (
                            <div className="mt-3 pt-3 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
                              <p>Envío a: <strong className="text-[var(--ink)]">{pedido.shipping_name}</strong> — {pedido.shipping_city}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
