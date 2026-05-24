'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, ArrowLeft, Package, ShoppingBag, Store,
  RefreshCw, DollarSign, Users, Zap, ArrowUpRight,
  ArrowDownRight, Calendar, BarChart2, Clock,
} from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import api from '@/lib/api';

const fmt   = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
const fmtS  = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}k` : `$${n}`;
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const item    = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { ease: [0.16, 1, 0.3, 1] as [number, number, number, number], duration: 0.45 } } };

const CHART_COLORS = ['#FF9900', '#007185', '#22c55e', '#8b5cf6', '#ef4444', '#0ea5e9'];

const ESTADOS_LABEL: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmado', processing: 'Preparando',
  shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado', refunded: 'Reembolsado',
};

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// ── Tooltip personalizado Recharts ────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[var(--border)] rounded-xl p-3 shadow-lg text-xs">
      <p className="font-bold text-[var(--text-primary)] mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
          <span className="text-[var(--text-secondary)]">{p.name}:</span>
          <span className="font-bold text-[var(--text-primary)]">
            {typeof p.value === 'number' && p.value > 10000 ? fmt(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────
function KPICard({ icon: Icon, label, value, sub, color, trend, trendVal }: {
  icon: React.ElementType; label: string; value: string; sub?: string;
  color: string; trend?: 'up' | 'down' | 'neutral'; trendVal?: string;
}) {
  return (
    <motion.div variants={item} whileHover={{ y: -3 }}
      className="bg-white border border-[var(--border)] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && trendVal && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
            trend === 'up' ? 'bg-green-50 text-green-700' :
            trend === 'down' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600'
          }`}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : null}
            {trendVal}
          </div>
        )}
      </div>
      <div className="text-2xl font-black text-[var(--text-primary)] mb-0.5">{value}</div>
      <div className="text-sm font-medium text-[var(--text-secondary)]">{label}</div>
      {sub && <div className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</div>}
    </motion.div>
  );
}

export default function AnalyticsPage() {
  const [tiendas, setTiendas] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [prods,   setProds]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<'7d' | '30d' | '90d'>('30d');

  const cargar = async () => {
    setLoading(true);
    try {
      const tr = await api.get('/stores/my');
      setTiendas(tr.data);
      const allP: any[] = [], allO: any[] = [];
      await Promise.all(tr.data.map(async (t: any) => {
        try {
          const [pr, or] = await Promise.all([
            api.get(`/stores/${t.id}/products`),
            api.get(`/orders/store/${t.id}`),
          ]);
          allP.push(...pr.data); allO.push(...or.data);
        } catch {}
      }));
      setProds(allP); setPedidos(allO);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { cargar(); }, []);

  // ── Métricas calculadas ──────────────────────────────
  const validos      = pedidos.filter(p => p.status !== 'cancelled' && p.status !== 'refunded');
  const totalIngreso = validos.reduce((s, p) => s + (p.total ?? 0), 0);
  const pendientes   = pedidos.filter(p => p.status === 'pending').length;
  const activos      = prods.filter(p => p.is_active).length;
  const stockBajo    = prods.filter(p => p.is_active && p.stock <= 5).length;
  const ticket       = validos.length > 0 ? totalIngreso / validos.length : 0;

  // ── Ventas por mes (últimos 6 meses) ─────────────────
  const ventasPorMes = useMemo(() => {
    const ahora  = new Date();
    const mapa: Record<string, { ingresos: number; pedidos: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      mapa[`${MESES[d.getMonth()]} ${d.getFullYear()}`] = { ingresos: 0, pedidos: 0 };
    }
    validos.forEach(p => {
      const d   = new Date(p.created_at);
      const key = `${MESES[d.getMonth()]} ${d.getFullYear()}`;
      if (mapa[key]) { mapa[key].ingresos += p.total ?? 0; mapa[key].pedidos += 1; }
    });
    return Object.entries(mapa).map(([mes, v]) => ({ mes, ...v }));
  }, [pedidos]);

  // ── Pedidos por día (últimos 14 días) ─────────────────
  const pedidosPorDia = useMemo(() => {
    const dias = periodo === '7d' ? 7 : periodo === '30d' ? 30 : 90;
    const mapa: Record<string, number> = {};
    for (let i = dias - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      mapa[d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })] = 0;
    }
    validos.forEach(p => {
      const d   = new Date(p.created_at);
      const key = d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
      if (mapa[key] !== undefined) mapa[key]++;
    });
    return Object.entries(mapa).map(([dia, cantidad]) => ({ dia, cantidad }));
  }, [pedidos, periodo]);

  // ── Pedidos por estado (pie) ──────────────────────────
  const porEstado = useMemo(() =>
    (Object.entries(
      pedidos.reduce((acc, p) => ({ ...acc, [p.status]: (acc[p.status] ?? 0) + 1 }), {} as Record<string, number>)
    ) as [string, number][]).map(([status, value]) => ({ name: ESTADOS_LABEL[status] ?? status, value }))
      .sort((a, b) => b.value - a.value),
    [pedidos]);

  // ── Top productos ─────────────────────────────────────
  const topProductos = useMemo(() =>
    [...prods].filter(p => p.is_active).sort((a, b) => b.price - a.price).slice(0, 8),
    [prods]);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Header */}
      <div className="bg-[var(--nav-bg)] px-4 md:px-6 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/owner" className="text-white/60 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-400/30">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Analíticas</h1>
              <p className="text-white/50 text-sm">Resumen de tu negocio en Shopper</p>
            </div>
          </div>
          <button onClick={cargar} disabled={loading}
            className="flex items-center gap-2 border border-white/20 text-white/70 hover:text-white hover:border-white/40 rounded-lg px-4 py-2 text-sm transition-all disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
            </div>
            <div className="skeleton h-80 rounded-2xl" />
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard icon={DollarSign}  label="Ingresos totales" value={fmtS(totalIngreso)} sub={`${validos.length} pedidos válidos`}       color="bg-orange-100 text-orange-600" trend="up"      trendVal="+12%" />
              <KPICard icon={ShoppingBag} label="Total pedidos"    value={String(pedidos.length)} sub={`${pendientes} pendientes`}             color="bg-blue-100 text-blue-600"   trend="up"      trendVal="+5%"  />
              <KPICard icon={BarChart2}   label="Ticket promedio"  value={fmtS(ticket)}       sub="Por pedido"                                  color="bg-purple-100 text-purple-600" trend="neutral" trendVal="~"    />
              <KPICard icon={Package}     label="Productos activos" value={String(activos)}   sub={stockBajo > 0 ? `⚠ ${stockBajo} con stock bajo` : 'Inventario OK'} color="bg-green-100 text-green-600" trend={stockBajo > 0 ? 'down' : 'up'} trendVal={stockBajo > 0 ? `${stockBajo} bajos` : 'OK'} />
            </div>

            {/* Gráfica ingresos por mes */}
            <motion.div variants={item} className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-bold text-[var(--text-primary)] text-base">Ingresos por mes</h2>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">Últimos 6 meses</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium text-[var(--text-secondary)]">{MESES[new Date().getMonth()]} {new Date().getFullYear()}</span>
                </div>
              </div>
              {ventasPorMes.some(v => v.ingresos > 0) ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={ventasPorMes} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#FF9900" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#FF9900" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={v => fmtS(v)} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#FF9900" strokeWidth={2.5} fill="url(#gradIngresos)" dot={{ r: 4, fill: '#FF9900', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#FF9900' }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-56 flex items-center justify-center text-center">
                  <div>
                    <TrendingUp className="w-10 h-10 text-[var(--border-hover)] mx-auto mb-2" />
                    <p className="text-[var(--text-muted)] text-sm">Aún no hay datos de ingresos</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Los datos aparecerán aquí cuando recibas pedidos</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Pedidos por día + Distribución por estado */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Pedidos por día */}
              <motion.div variants={item} className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-bold text-[var(--text-primary)] text-base">Pedidos por día</h2>
                    <p className="text-xs text-[var(--text-muted)]">Actividad reciente</p>
                  </div>
                  <div className="flex gap-1">
                    {(['7d', '30d', '90d'] as const).map(p => (
                      <button key={p} onClick={() => setPeriodo(p)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                          periodo === p ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
                        }`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={pedidosPorDia} margin={{ top: 0, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
                      interval={periodo === '90d' ? 6 : periodo === '30d' ? 3 : 0} />
                    <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="cantidad" name="Pedidos" fill="#FF9900" radius={[4, 4, 0, 0]}
                      maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Pedidos por estado — pie chart */}
              <motion.div variants={item} className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-[var(--text-primary)] text-base mb-1">Distribución por estado</h2>
                <p className="text-xs text-[var(--text-muted)] mb-4">Total: {pedidos.length} pedidos</p>
                {porEstado.length > 0 ? (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width={180} height={180}>
                      <PieChart>
                        <Pie data={porEstado} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                          paddingAngle={3} dataKey="value">
                          {porEstado.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                      {porEstado.map((e, i) => (
                        <div key={e.name} className="flex items-center gap-2 text-xs">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="text-[var(--text-secondary)] flex-1 truncate">{e.name}</span>
                          <span className="font-bold text-[var(--text-primary)]">{e.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-44 flex items-center justify-center">
                    <p className="text-sm text-[var(--text-muted)]">Sin pedidos aún</p>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Top productos */}
            {topProductos.length > 0 && (
              <motion.div variants={item} className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-between">
                  <h2 className="font-bold text-[var(--text-primary)] text-base flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[var(--accent)]" /> Top productos por valor
                  </h2>
                  <Link href="/owner/products" className="text-xs text-[var(--blue)] hover:underline font-medium">Ver todos</Link>
                </div>
                {topProductos.map((p, i) => (
                  <div key={p._id} className={`flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--surface-2)] transition-colors ${i < topProductos.length - 1 ? 'border-b border-[var(--border)]' : ''}`}>
                    <span className="text-sm font-black text-[var(--text-muted)] w-6 shrink-0">#{i + 1}</span>
                    <div className="w-10 h-10 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                      {p.images?.[0] ? <img src={p.images[0]} alt="" className="w-full h-full object-contain p-1" /> : <Package className="w-4 h-4 text-[var(--text-muted)]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{p.title}</p>
                      <p className="text-xs text-[var(--text-muted)]">SKU: {p.sku} · Stock: {p.stock}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-[var(--accent-dark)]">{fmt(p.price)}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        p.stock <= 0 ? 'bg-red-100 text-red-700' :
                        p.stock <= 5 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'}`}>
                        {p.stock <= 0 ? 'Agotado' : p.stock <= 5 ? 'Stock bajo' : 'Disponible'}
                      </span>
                    </div>
                    {/* Mini sparkline bar */}
                    <div className="w-16 h-6 hidden sm:block">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[{ v: p.price }, { v: p.price * 0.8 }, { v: p.price * 1.1 }]}>
                          <Bar dataKey="v" fill="#FF9900" radius={[2, 2, 0, 0]} maxBarSize={8} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Resumen tiendas */}
            <motion.div variants={item} className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-sm">
              <h2 className="font-bold text-[var(--text-primary)] text-base mb-4 flex items-center gap-2">
                <Store className="w-4 h-4 text-[var(--accent)]" /> Mis tiendas
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {tiendas.map(t => (
                  <Link key={t.id} href={`/store/${t.slug}`} target="_blank"
                    className="flex items-center gap-2.5 p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] hover:border-[var(--accent-border)] hover:shadow-sm transition-all group">
                    <div className="w-9 h-9 bg-[var(--accent)] rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0">
                      {t.name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--accent-dark)] transition-colors">{t.name}</p>
                      <span className={`text-[10px] font-semibold ${t.is_published ? 'text-green-600' : 'text-gray-500'}`}>
                        {t.is_published ? '● Publicada' : '○ Oculta'}
                      </span>
                    </div>
                  </Link>
                ))}
                <Link href="/owner/stores"
                  className="flex items-center justify-center gap-1.5 p-3 border-2 border-dashed border-[var(--border)] rounded-xl text-xs text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent-dark)] transition-all">
                  + Nueva tienda
                </Link>
              </div>
            </motion.div>

          </motion.div>
        )}
      </div>
    </div>
  );
}
