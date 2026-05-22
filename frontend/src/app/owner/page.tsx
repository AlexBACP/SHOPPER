'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Store, Package, ShoppingBag, TrendingUp, Plus, ArrowRight, AlertTriangle, Clock, CheckCircle2, Truck, XCircle, RefreshCw, Eye, Crown, ChevronRight, MapPin, Calendar } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
const fmtShort = (n: number) => n >= 1_000_000 ? `$${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(n/1_000).toFixed(0)}k` : `$${n.toLocaleString('es-CO')}`;
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
const saludo = (n: string) => { const h = new Date().getHours(); return `${h<12?'☀️ Buenos días':h<19?'👋 Buenas tardes':'🌙 Buenas noches'}, ${n.split(' ')[0]}`; };

const ESTADO: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:    { label: 'Pendiente',   color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock        },
  confirmed:  { label: 'Confirmado',  color: 'bg-blue-100   text-blue-700   border-blue-200',   icon: CheckCircle2 },
  processing: { label: 'Preparando',  color: 'bg-purple-100 text-purple-700 border-purple-200', icon: RefreshCw    },
  shipped:    { label: 'Enviado',     color: 'bg-cyan-100   text-cyan-700   border-cyan-200',   icon: Truck        },
  delivered:  { label: 'Entregado',   color: 'bg-green-100  text-green-700  border-green-200',  icon: CheckCircle2 },
  cancelled:  { label: 'Cancelado',   color: 'bg-red-100    text-red-700    border-red-200',    icon: XCircle      },
  refunded:   { label: 'Reembolsado', color: 'bg-gray-100   text-gray-600   border-gray-200',   icon: RefreshCw    },
};

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const item    = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { ease: [0.16,1,0.3,1] as [number,number,number,number], duration: 0.45 } } };

function StatCard({ icon: Icon, label, value, sub, color, onClick }: { icon: React.ElementType; label: string; value: React.ReactNode; sub?: string; color: string; onClick?: () => void }) {
  return (
    <motion.div variants={item} whileHover={{ y: -3 }} onClick={onClick}
      className={`bg-white border border-[var(--border)] rounded-xl p-5 shadow-sm hover:shadow-md transition-all ${onClick ? 'cursor-pointer hover:border-[var(--accent-border)]' : ''}`}>
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}><Icon className="w-5 h-5" /></div>
      <div className="text-2xl font-black text-[var(--text-primary)] mb-0.5">{value}</div>
      <div className="text-sm text-[var(--text-secondary)] font-medium">{label}</div>
      {sub && <div className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</div>}
    </motion.div>
  );
}

export default function OwnerDashboard() {
  const { user } = useAuthStore();
  const [tiendas, setTiendas]   = useState<any[]>([]);
  const [pedidos, setPedidos]   = useState<any[]>([]);
  const [prods,   setProds]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [updatedAt, setUpdatedAt] = useState(new Date());

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const tr = await api.get('/stores/my');
      setTiendas(tr.data);
      const allProds: any[] = [], allPedidos: any[] = [];
      await Promise.all(tr.data.map(async (t: any) => {
        try {
          const [pr, or] = await Promise.all([api.get(`/stores/${t.id}/products`), api.get(`/orders/store/${t.id}`)]);
          allProds.push(...pr.data); allPedidos.push(...or.data);
        } catch {}
      }));
      setProds(allProds); setPedidos(allPedidos); setUpdatedAt(new Date());
    } catch { toast.error('Error al cargar datos'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const totalIngresos = pedidos.filter(p => p.status !== 'cancelled' && p.status !== 'refunded').reduce((s, p) => s + (p.total ?? 0), 0);
  const pendientes    = pedidos.filter(p => p.status === 'pending').length;
  const stockBajo     = prods.filter(p => p.is_active && p.stock <= 5);
  const activos       = prods.filter(p => p.is_active).length;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Header */}
      <div className="bg-[var(--nav-bg)] px-4 md:px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[var(--accent)] rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-lg">
                {user.name[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-white/60 text-sm">Panel del vendedor</p>
                <h1 className="text-xl font-bold text-white">{saludo(user.name)}</h1>
              </div>
            </div>
            <button onClick={cargar} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 border border-white/20 text-white/70 hover:text-white hover:border-white/40 rounded-lg text-sm transition-all disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{loading ? 'Actualizando...' : 'Actualizar'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">

          {/* Stats */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i=><div key={i} className="skeleton h-28 rounded-xl"/>)}</div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={TrendingUp}  label="Ingresos totales" value={fmtShort(totalIngresos)} sub={`${pedidos.length} pedidos`}          color="bg-orange-100 text-orange-600" onClick={() => window.location.href='/owner/analytics'} />
              <StatCard icon={ShoppingBag} label="Pedidos"          value={pedidos.length}          sub={pendientes > 0 ? `${pendientes} pendientes` : 'Al día'} color="bg-blue-100 text-blue-600" onClick={() => window.location.href='/owner/orders'} />
              <StatCard icon={Store}       label="Tiendas"          value={tiendas.filter(t=>t.is_published).length} sub={`De ${tiendas.length} total`} color="bg-purple-100 text-purple-600" onClick={() => window.location.href='/owner/stores'} />
              <StatCard icon={Package}     label="Productos"        value={activos}                 sub={stockBajo.length > 0 ? `${stockBajo.length} con stock bajo` : 'Inventario OK'} color="bg-green-100 text-green-600" onClick={() => window.location.href='/owner/products'} />
            </div>
          )}

          {/* Alertas */}
          {!loading && (pendientes > 0 || stockBajo.length > 0) && (
            <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pendientes > 0 && (
                <Link href="/owner/orders" className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 hover:bg-yellow-100 transition-colors group">
                  <div className="w-10 h-10 bg-yellow-100 border border-yellow-200 rounded-xl flex items-center justify-center shrink-0"><Clock className="w-5 h-5 text-yellow-700" /></div>
                  <div className="flex-1"><p className="text-sm font-bold text-yellow-800">{pendientes} pedido{pendientes>1?'s':''} pendiente{pendientes>1?'s':''}</p><p className="text-xs text-yellow-600">Requieren atención</p></div>
                  <ChevronRight className="w-4 h-4 text-yellow-600 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
              {stockBajo.length > 0 && (
                <Link href="/owner/products" className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 hover:bg-red-100 transition-colors group">
                  <div className="w-10 h-10 bg-red-100 border border-red-200 rounded-xl flex items-center justify-center shrink-0"><AlertTriangle className="w-5 h-5 text-red-700" /></div>
                  <div className="flex-1"><p className="text-sm font-bold text-red-800">{stockBajo.length} producto{stockBajo.length>1?'s':''} con stock bajo</p><p className="text-xs text-red-600">Actualiza tu inventario</p></div>
                  <ChevronRight className="w-4 h-4 text-red-600 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </motion.div>
          )}

          {/* Pedidos recientes */}
          {!loading && pedidos.length > 0 && (
            <motion.div variants={item}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-[var(--text-primary)]">Pedidos recientes</h2>
                <Link href="/owner/orders" className="text-xs text-[var(--blue)] hover:underline flex items-center gap-1">Ver todos <ArrowRight className="w-3 h-3" /></Link>
              </div>
              <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
                {pedidos.slice(0,5).map((p, i) => {
                  const e = ESTADO[p.status] ?? ESTADO.pending;
                  return (
                    <div key={p.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface-2)] transition-colors ${i < Math.min(pedidos.length,5)-1 ? 'border-b border-[var(--border)]' : ''}`}>
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${e.color}`}><e.icon className="w-4 h-4" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">#{p.id?.slice(-8)?.toUpperCase()}</p>
                        <p className="text-xs text-[var(--text-muted)]">{fmtDate(p.created_at)} · {p.shipping_city}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${e.color} shrink-0 hidden sm:block`}>{e.label}</span>
                      <p className="text-sm font-bold text-[var(--text-primary)] shrink-0">{fmt(p.total)}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Mis tiendas */}
          {!loading && tiendas.length > 0 && (
            <motion.div variants={item}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-[var(--text-primary)]">Mis tiendas</h2>
                <Link href="/owner/stores" className="text-xs text-[var(--blue)] hover:underline flex items-center gap-1">Gestionar <ArrowRight className="w-3 h-3" /></Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tiendas.map(t => (
                  <div key={t.id} className="bg-white border border-[var(--border)] rounded-xl overflow-hidden hover:shadow-md hover:border-[var(--accent-border)] transition-all group">
                    <div className="h-20 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center relative">
                      {t.logo_url ? <img src={t.logo_url} alt={t.name} className="w-10 h-10 rounded-xl object-cover shadow" />
                        : <div className="w-10 h-10 bg-[var(--accent)] rounded-xl flex items-center justify-center shadow"><span className="text-white font-black">{t.name[0]?.toUpperCase()}</span></div>}
                      <span className={`absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full border font-semibold ${t.is_published ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {t.is_published ? 'Publicada' : 'Oculta'}
                      </span>
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-sm truncate group-hover:text-[var(--accent-dark)] transition-colors mb-3">{t.name}</p>
                      <div className="flex gap-2">
                        <Link href={`/owner/products?store=${t.id}`} className="flex-1 text-xs py-1.5 border border-[var(--border)] rounded-lg text-center text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors">Productos</Link>
                        <Link href={`/store/${t.slug}`} target="_blank" className="flex-1 text-xs py-1.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-center hover:bg-[var(--surface-3)] transition-colors flex items-center justify-center gap-1"><Eye className="w-3 h-3"/>Ver</Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Sin tiendas */}
          {!loading && tiendas.length === 0 && (
            <motion.div variants={item} className="bg-orange-50 border border-orange-200 rounded-xl p-10 text-center">
              <Crown className="w-12 h-12 text-[var(--accent)] mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">¡Crea tu primera tienda!</h3>
              <p className="text-[var(--text-muted)] mb-5 max-w-sm mx-auto">Empieza a vender en minutos. Sin comisiones iniciales. Llega a miles de compradores en Colombia.</p>
              <Link href="/owner/stores" className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold px-6 py-3 rounded-lg text-sm transition-all hover:shadow-md">
                <Plus className="w-4 h-4" /> Nueva tienda gratis
              </Link>
            </motion.div>
          )}

          {/* Accesos rápidos */}
          <motion.div variants={item}>
            <h2 className="font-bold text-[var(--text-primary)] mb-3">Accesos rápidos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { href: '/owner/stores',    icon: Store,       label: 'Tiendas',    color: 'bg-orange-100 text-orange-600' },
                { href: '/owner/products',  icon: Package,     label: 'Productos',  color: 'bg-purple-100 text-purple-600' },
                { href: '/owner/orders',    icon: ShoppingBag, label: 'Pedidos',    color: 'bg-blue-100 text-blue-600'    },
                { href: '/owner/analytics', icon: TrendingUp,  label: 'Analíticas', color: 'bg-green-100 text-green-600'  },
              ].map(({ href, icon: Icon, label, color }) => (
                <Link key={href} href={href}
                  className="flex flex-col items-center gap-2 bg-white border border-[var(--border)] rounded-xl p-4 hover:border-[var(--accent-border)] hover:shadow-md transition-all group text-center">
                  <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform`}><Icon className="w-5 h-5" /></div>
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">{label}</span>
                </Link>
              ))}
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
