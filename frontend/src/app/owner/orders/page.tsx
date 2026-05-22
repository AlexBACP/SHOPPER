'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowLeft, Clock, CheckCircle2, Truck, XCircle, RefreshCw, ChevronDown, ChevronUp, Package, Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import api from '@/lib/api';

const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' });

const ESTADOS: Record<string, { label:string; color:string; icon:React.ElementType }> = {
  pending:    { label:'Pendiente',   color:'bg-yellow-100 text-yellow-700 border-yellow-200', icon:Clock        },
  confirmed:  { label:'Confirmado',  color:'bg-blue-100   text-blue-700   border-blue-200',   icon:CheckCircle2 },
  processing: { label:'Preparando',  color:'bg-purple-100 text-purple-700 border-purple-200', icon:RefreshCw    },
  shipped:    { label:'Enviado',     color:'bg-cyan-100   text-cyan-700   border-cyan-200',   icon:Truck        },
  delivered:  { label:'Entregado',   color:'bg-green-100  text-green-700  border-green-200',  icon:CheckCircle2 },
  cancelled:  { label:'Cancelado',   color:'bg-red-100    text-red-700    border-red-200',    icon:XCircle      },
  refunded:   { label:'Reembolsado', color:'bg-gray-100   text-gray-600   border-gray-200',   icon:RefreshCw    },
};
const FLUJO: string[] = ['pending','confirmed','processing','shipped','delivered'];

export default function OwnerOrdersPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState<string|null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('all');

  const cargar = async () => {
    setLoading(true);
    try {
      const ts = await api.get('/stores/my');
      const todos: any[] = [];
      await Promise.all(ts.data.map(async (t:any) => {
        try { const r = await api.get(`/orders/store/${t.id}`); todos.push(...r.data); } catch {}
      }));
      setPedidos(todos.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { cargar(); }, []);

  const avanzarEstado = async (pedido: any) => {
    const idx = FLUJO.indexOf(pedido.status);
    if (idx < 0 || idx >= FLUJO.length-1) return;
    try {
      await api.put(`/orders/${pedido.id}/status`, { status: FLUJO[idx+1] });
      toast.success(`Pedido actualizado a: ${ESTADOS[FLUJO[idx+1]].label}`);
      cargar();
    } catch { toast.error('Error al actualizar estado'); }
  };

  const filtrados = pedidos.filter(p => {
    const matchQ = p.id?.toLowerCase().includes(busqueda.toLowerCase()) || p.shipping_name?.toLowerCase().includes(busqueda.toLowerCase());
    const matchE = filtroEstado === 'all' || p.status === filtroEstado;
    return matchQ && matchE;
  });

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="bg-[var(--nav-bg)] px-4 md:px-6 py-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/owner" className="text-white/60 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5"/></Link>
            <div><h1 className="text-xl font-bold text-white">Pedidos</h1><p className="text-white/50 text-sm">{pedidos.length} pedidos en total</p></div>
          </div>
          <button onClick={cargar} disabled={loading} className="flex items-center gap-2 border border-white/20 text-white/70 hover:text-white hover:border-white/40 rounded-lg px-3 py-2 text-sm transition-all">
            <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/> Actualizar
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]"/>
            <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar pedido o cliente..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[var(--border)] rounded-lg outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-orange-100 transition-all"/>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all','pending','processing','shipped','delivered','cancelled'].map(e => (
              <button key={e} onClick={() => setFiltroEstado(e)}
                className={`text-xs px-3 py-2 rounded-lg border font-medium transition-all ${filtroEstado===e ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'bg-white border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'}`}>
                {e==='all' ? 'Todos' : (ESTADOS[e]?.label ?? e)}
              </button>
            ))}
          </div>
        </div>

        {loading ? <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="skeleton h-20 rounded-xl"/>)}</div>
        : filtrados.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-12 h-12 text-[var(--border-hover)] mx-auto mb-4"/>
            <p className="text-[var(--text-secondary)] font-medium">{busqueda||filtroEstado!=='all'?'Sin resultados':'Sin pedidos aún'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtrados.map((p, i) => {
              const e = ESTADOS[p.status] ?? ESTADOS.pending;
              const abierto = expandido === p.id;
              const idx = FLUJO.indexOf(p.status);
              const puedeAvanzar = idx >= 0 && idx < FLUJO.length-1;
              return (
                <motion.div key={p.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
                  className="bg-white border border-[var(--border)] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 px-4 py-4 cursor-pointer" onClick={()=>setExpandido(abierto?null:p.id)}>
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${e.color}`}><e.icon className="w-5 h-5"/></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="text-sm font-bold">#{p.id?.slice(-8)?.toUpperCase()}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${e.color}`}>{e.label}</span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">{fmtDate(p.created_at)} · {p.shipping_name} · {p.shipping_city}</p>
                    </div>
                    <div className="text-right shrink-0 mr-2">
                      <p className="font-black text-[var(--text-primary)]">{fmt(p.total)}</p>
                      <p className="text-xs text-[var(--text-muted)]">{p.items?.length ?? 0} artículos</p>
                    </div>
                    {abierto ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)] shrink-0"/> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)] shrink-0"/>}
                  </div>
                  <AnimatePresence>
                    {abierto && (
                      <motion.div initial={{height:0}} animate={{height:'auto'}} exit={{height:0}} className="overflow-hidden">
                        <div className="border-t border-[var(--border)] px-4 py-4 bg-[var(--surface-2)] space-y-3">
                          {p.items?.map((it:any, j:number) => (
                            <div key={j} className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-white border border-[var(--border)] rounded-lg flex items-center justify-center shrink-0"><Package className="w-4 h-4 text-[var(--text-muted)]"/></div>
                              <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{it.title}</p><p className="text-xs text-[var(--text-muted)]">x{it.quantity}</p></div>
                              <p className="text-sm font-bold text-[var(--text-primary)] shrink-0">{fmt(it.price*it.quantity)}</p>
                            </div>
                          ))}
                          {p.shipping_address && <p className="text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border)]">📦 {p.shipping_address}, {p.shipping_city}</p>}
                          {puedeAvanzar && (
                            <button onClick={()=>avanzarEstado(p)}
                              className="flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold px-4 py-2 rounded-lg text-xs transition-all hover:shadow-md">
                              Marcar como: {ESTADOS[FLUJO[idx+1]]?.label}
                            </button>
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
