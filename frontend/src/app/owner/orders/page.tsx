'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, ArrowLeft, Clock, CheckCircle2, Truck, XCircle, RefreshCw, ChevronDown, ChevronUp, Package, Search,
  X, Loader2, ImagePlus, ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import api from '@/lib/api';
import { handleApiError } from '@/lib/errors';
import { CARRIER_LIST, carrierName, trackingUrl } from '@/lib/shipping';

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

  // Modal de envío (marcar como 'shipped')
  const [envioPedido, setEnvioPedido] = useState<any|null>(null);
  const [carrier,     setCarrier]     = useState('');
  const [guia,        setGuia]        = useState('');
  const [proofImg,    setProofImg]    = useState('');
  const [subiendo,    setSubiendo]    = useState(false);
  const [guardando,   setGuardando]   = useState(false);

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

  // Estados que el owner puede asignar (el backend también lo valida)
  const OWNER_ESTADOS = ['processing', 'shipped'];

  const avanzarEstado = async (pedido: any) => {
    const idx = FLUJO.indexOf(pedido.status);
    if (idx < 0 || idx >= FLUJO.length - 1) return;
    const siguienteEstado = FLUJO[idx + 1];
    if (!OWNER_ESTADOS.includes(siguienteEstado)) return;

    // Marcar como 'shipped' requiere transportadora + guía → abrir modal
    if (siguienteEstado === 'shipped') {
      setEnvioPedido(pedido);
      setCarrier(''); setGuia(''); setProofImg('');
      return;
    }

    try {
      await api.patch(`/orders/${pedido.id}/status`, { status: siguienteEstado });
      toast.success(`Pedido actualizado a: ${ESTADOS[siguienteEstado].label}`);
      cargar();
    } catch (e) { handleApiError(e, 'No pudimos actualizar el estado del pedido. Intenta de nuevo.'); }
  };

  const subirFoto = async (file: File) => {
    setSubiendo(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await api.post('/upload/image?folder=products', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProofImg(r.data.url);
      toast.success('Foto del paquete subida');
    } catch (e) { handleApiError(e, 'No pudimos subir la foto. Verifica el archivo e intenta de nuevo.'); }
    finally { setSubiendo(false); }
  };

  const confirmarEnvio = async () => {
    if (!envioPedido) return;
    if (!carrier)        { toast.error('Selecciona la transportadora'); return; }
    if (guia.trim().length < 3) { toast.error('Ingresa un número de guía válido'); return; }
    setGuardando(true);
    try {
      await api.patch(`/orders/${envioPedido.id}/status`, {
        status: 'shipped',
        carrier,
        tracking_number: guia.trim(),
        proof_image: proofImg || undefined,
      });
      toast.success('Pedido marcado como enviado');
      setEnvioPedido(null);
      cargar();
    } catch (e) {
      handleApiError(e, 'No pudimos marcar el pedido como enviado. Intenta de nuevo.');
    } finally { setGuardando(false); }
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
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-[var(--bone-2)] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-orange-100 transition-all"/>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all','pending','processing','shipped','delivered','cancelled'].map(e => (
              <button key={e} onClick={() => setFiltroEstado(e)}
                className={`text-xs px-3 py-2 rounded-lg border font-medium transition-all ${filtroEstado===e ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'bg-[var(--bone-2)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'}`}>
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
              const siguienteEstado = FLUJO[idx + 1];
              const puedeAvanzar = idx >= 0 && idx < FLUJO.length - 1 && OWNER_ESTADOS.includes(siguienteEstado);
              return (
                <motion.div key={p.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
                  className="bg-[var(--bone-2)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
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
                              <div className="w-9 h-9 bg-[var(--bone-2)] border border-[var(--border)] rounded-lg flex items-center justify-center shrink-0"><Package className="w-4 h-4 text-[var(--text-muted)]"/></div>
                              <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{it.title}</p><p className="text-xs text-[var(--text-muted)]">x{it.quantity}</p></div>
                              <p className="text-sm font-bold text-[var(--text-primary)] shrink-0">{fmt(it.price*it.quantity)}</p>
                            </div>
                          ))}
                          {p.shipping_address && <p className="text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border)]"> {p.shipping_address}, {p.shipping_city}</p>}
                          {p.carrier && (
                            <div className="flex items-center gap-2 text-xs bg-cyan-50 border border-cyan-200 text-cyan-800 rounded-lg px-3 py-2">
                              <Truck className="w-4 h-4 shrink-0" />
                              <span className="font-semibold">{carrierName(p.carrier)}</span>
                              <span className="text-cyan-600">· Guía {p.tracking_number}</span>
                              {trackingUrl(p.carrier, p.tracking_number) && (
                                <a href={trackingUrl(p.carrier, p.tracking_number)!} target="_blank" rel="noopener noreferrer"
                                  className="ml-auto flex items-center gap-1 font-semibold hover:underline">
                                  Rastrear <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          )}
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

      {/* ── Modal: marcar como Enviado (transportadora + guía) ── */}
      <AnimatePresence>
        {envioPedido && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => !guardando && setEnvioPedido(null)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:10 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-[var(--bone-2)] border border-[var(--border)] rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--surface-2)]">
                <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[var(--accent)]" /> Marcar como enviado
                </h3>
                <button onClick={() => !guardando && setEnvioPedido(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-xs text-[var(--text-muted)]">
                  Pedido <span className="font-bold text-[var(--text-secondary)]">#{envioPedido.id?.slice(-8)?.toUpperCase()}</span> · {envioPedido.shipping_city}
                </p>

                {/* Transportadora */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Transportadora *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CARRIER_LIST.map(c => (
                      <button key={c.id} type="button" onClick={() => setCarrier(c.id)}
                        className={`text-sm font-medium px-3 py-2.5 rounded-xl border-2 transition-all ${
                          carrier === c.id ? 'border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent-dark)]' : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]'
                        }`}>
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Guía */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">Número de guía *</label>
                  <input value={guia} onChange={e => setGuia(e.target.value)} placeholder="Ej. 1234567890"
                    className="w-full px-4 py-2.5 text-sm bg-[var(--bone-2)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-orange-100 transition-all" />
                </div>

                {/* Foto del paquete (opcional) */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
                    Foto del paquete recogido <span className="font-normal text-[var(--text-muted)]">(opcional)</span>
                  </label>
                  {proofImg ? (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden border border-[var(--border)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={proofImg} alt="Paquete" className="w-full h-full object-cover" />
                      <button onClick={() => setProofImg('')} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-1 w-full h-24 border-2 border-dashed border-[var(--border)] rounded-xl cursor-pointer hover:border-[var(--accent)] transition-all text-[var(--text-muted)]">
                      {subiendo ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
                      <span className="text-xs">{subiendo ? 'Subiendo...' : 'Subir foto'}</span>
                      <input type="file" accept="image/*" className="hidden" disabled={subiendo}
                        onChange={e => { const f = e.target.files?.[0]; if (f) subirFoto(f); }} />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex gap-3 px-5 py-4 border-t border-[var(--border)] bg-[var(--surface-2)]">
                <button onClick={() => setEnvioPedido(null)} disabled={guardando}
                  className="flex-1 py-2.5 border border-[var(--border)] rounded-xl text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bone-2)] transition-colors disabled:opacity-50">
                  Cancelar
                </button>
                <button onClick={confirmarEnvio} disabled={guardando || subiendo}
                  className="flex-[1.4] flex items-center justify-center gap-2 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold rounded-xl text-sm transition-all disabled:opacity-60">
                  {guardando ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><Truck className="w-4 h-4" /> Confirmar envío</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
