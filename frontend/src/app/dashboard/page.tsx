'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Store, Package, ShoppingCart, TrendingUp, Shield,
  ArrowRight, Plus, Eye, ShoppingBag, Crown, CheckCircle,
  AlertCircle, Zap, BarChart3, Loader2,
  Users, Heart, Clock,
  MapPin, ChevronRight, DollarSign, Sun, Moon, Sunrise,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { useWishlistStore } from '@/store/wishlist.store';
import api from '@/lib/api';

// Postgres devuelve los numeric/decimal como string → siempre coercer a número
const toNum = (v: unknown): number => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const fmt  = (n: unknown) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(toNum(n));
const fmtS = (n: unknown) => { const v = toNum(n); return v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `$${(v / 1_000).toFixed(0)}k` : `$${v}`; };
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const anim    = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { ease: [0.16,1,0.3,1] as [number,number,number,number], duration: 0.5 } } };

// Saludo según la hora — con icono real, sin emojis
function saludoActual(): { Icon: LucideIcon; text: string } {
  const h = new Date().getHours();
  if (h < 12) return { Icon: Sunrise, text: 'Buenos días'   };
  if (h < 19) return { Icon: Sun,     text: 'Buenas tardes' };
  return            { Icon: Moon,    text: 'Buenas noches' };
}

const ESTADOS: Record<string,{ label:string; color:string; icon:React.ElementType }> = {
  pending:    { label:'Pendiente',  color:'text-yellow-700 bg-yellow-50 border-yellow-200', icon:Clock        },
  confirmed:  { label:'Confirmado', color:'text-blue-700   bg-blue-50   border-blue-200',   icon:CheckCircle  },
  processing: { label:'Preparando', color:'text-purple-700 bg-purple-50 border-purple-200', icon:Zap          },
  shipped:    { label:'Enviado',    color:'text-cyan-700   bg-cyan-50   border-cyan-200',   icon:MapPin       },
  delivered:  { label:'Entregado',  color:'text-green-700  bg-green-50  border-green-200',  icon:CheckCircle  },
  cancelled:  { label:'Cancelado',  color:'text-red-700    bg-red-50    border-red-200',    icon:AlertCircle  },
};

function StatCard({ icon: Icon, label, value, sub, color, href }: {
  icon: React.ElementType; label: string; value: React.ReactNode;
  sub?: string; color: string; href?: string;
}) {
  const Inner = (
    <motion.div variants={anim} whileHover={{ y: -3 }}
      className={`bg-white border border-[var(--border)] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all ${href ? 'cursor-pointer hover:border-[var(--accent-border)]' : ''}`}>
      <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-black text-[var(--text-primary)] mb-0.5">{value}</div>
      <div className="text-sm font-semibold text-[var(--text-secondary)]">{label}</div>
      {sub && <div className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</div>}
      {href && <div className="flex items-center gap-1 mt-2 text-xs text-[var(--blue)] font-medium">Ver <ArrowRight className="w-3 h-3" /></div>}
    </motion.div>
  );
  return href ? <Link href={href}>{Inner}</Link> : Inner;
}

/* ─── DASHBOARD COMPRADOR ─────────────────────────────────────────────────── */
function DashboardComprador({ nombre }: { nombre: string }) {
  const { items, count, total, openCart } = useCartStore();
  const wishCount = useWishlistStore(s => s.count)();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/my')
      .then(r => setPedidos(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalGastado = pedidos
    .filter(p => p.status !== 'cancelled' && p.status !== 'refunded')
    .reduce((s, p) => s + toNum(p.total), 0);

  const pendientes = pedidos.filter(p => p.status === 'pending' || p.status === 'processing' || p.status === 'shipped').length;

  // Gasto por mes (últimos 6)
  const gastosPorMes = (() => {
    const ahora = new Date();
    const mapa: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      mapa[MESES[d.getMonth()]] = 0;
    }
    pedidos.filter(p => p.status !== 'cancelled').forEach(p => {
      const d   = new Date(p.created_at);
      const key = MESES[d.getMonth()];
      if (mapa[key] !== undefined) mapa[key] += toNum(p.total);
    });
    return Object.entries(mapa).map(([mes, total]) => ({ mes, total }));
  })();

  const { Icon: SaludoIcon, text: saludo } = saludoActual();

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">

      {/* Banner de bienvenida */}
      <motion.div variants={anim}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--nav-bg)] to-[#1b2436] p-6 sm:p-7 shadow-lg">
        {/* Resplandor decorativo */}
        <div className="pointer-events-none absolute -top-16 -right-12 w-60 h-60 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/4 w-52 h-52 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-orange-900/30 shrink-0">
            {nombre[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold bg-white/10 text-white border border-white/15">
                <Shield className="w-3 h-3" /> Comprador
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-green-400 font-medium">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                En línea
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2 flex-wrap">
              <SaludoIcon className="w-5 h-5 text-[var(--accent)] shrink-0" strokeWidth={2.5} />
              {saludo}, <span className="text-[var(--accent)]">{nombre.split(' ')[0]}</span>
            </h1>
            <p className="text-sm text-white/50">Bienvenido a tu panel de compras</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={ShoppingCart} label="En carrito"   value={count()}     sub={count() > 0 ? fmt(total()) : 'Vacío'}      color="bg-orange-100 text-orange-600" />
        <StatCard icon={ShoppingBag} label="Mis pedidos"  value={pedidos.length} sub={pendientes > 0 ? `${pendientes} activos` : 'Al día'} color="bg-blue-100 text-blue-600" href="/orders" />
        <StatCard icon={DollarSign}  label="Total gastado" value={fmtS(totalGastado)} sub="En Shopper"                          color="bg-purple-100 text-purple-600" />
        <StatCard icon={Heart}       label="Favoritos"    value={wishCount}    sub="Guardados"                                  color="bg-rose-100 text-rose-500" href="/wishlist" />
      </div>

      {/* Gráfico de gasto si hay datos */}
      {gastosPorMes.some(g => g.total > 0) && (
        <motion.div variants={anim} className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-[var(--text-primary)] mb-1">Mis compras por mes</h2>
          <p className="text-xs text-[var(--text-muted)] mb-5">Últimos 6 meses</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={gastosPorMes} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCompras" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#FF9900" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#FF9900" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => fmtS(v)} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [fmt(v as number), 'Gasto']} contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', fontSize: 12 }} />
              <Area type="monotone" dataKey="total" stroke="#FF9900" strokeWidth={2.5} fill="url(#gradCompras)" dot={{ r: 4, fill: '#FF9900', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Carrito actual */}
      {items.length > 0 && (
        <motion.div variants={anim}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[var(--accent)]" /> Carrito actual
            </h2>
            <button onClick={openCart} className="text-xs text-[var(--blue)] hover:underline flex items-center gap-1 font-medium">
              Abrir <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
            {items.slice(0, 3).map((it, i) => (
              <div key={it.productId} className={`flex items-center gap-3 px-4 py-3.5 ${i < Math.min(items.length, 3) - 1 ? 'border-b border-[var(--border)]' : ''}`}>
                <div className="w-10 h-10 bg-[var(--surface-2)] rounded-xl overflow-hidden border border-[var(--border)] shrink-0">
                  {it.image ? <img src={it.image} alt={it.title} className="w-full h-full object-contain p-1" /> : <Package className="w-4 h-4 text-[var(--text-muted)] m-auto mt-3" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{it.title}</p>
                  <p className="text-xs text-[var(--text-muted)]">×{it.quantity}</p>
                </div>
                <span className="text-sm font-black text-[var(--accent-dark)] shrink-0">{fmt(it.price * it.quantity)}</span>
              </div>
            ))}
            {items.length > 3 && <p className="px-4 py-2 text-xs text-[var(--text-muted)] border-t border-[var(--border)] bg-[var(--surface-2)]">+{items.length - 3} más en el carrito</p>}
            <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-between">
              <div className="text-sm">
                <span className="text-[var(--text-muted)]">Total: </span>
                <strong className="text-[var(--accent-dark)]">{fmt(total())}</strong>
                <span className="text-xs text-[var(--text-muted)] ml-1">(+ IVA 19%)</span>
              </div>
              <div className="flex gap-2">
                <button onClick={openCart} className="text-xs px-3 py-1.5 border border-[var(--border)] rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-3)] transition-colors">Ver</button>
                <Link href="/cart" className="text-xs px-3 py-1.5 bg-[var(--btn-cart-bg)] hover:bg-[var(--btn-cart-hover)] rounded-lg text-[var(--btn-cart-text)] font-bold transition-colors">Pagar</Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Pedidos recientes */}
      {!loading && pedidos.length > 0 && (
        <motion.div variants={anim}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[var(--accent)]" /> Pedidos recientes
            </h2>
            <Link href="/orders" className="text-xs text-[var(--blue)] hover:underline flex items-center gap-1 font-medium">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
            {pedidos.slice(0, 4).map((p, i) => {
              const e  = ESTADOS[p.status] ?? ESTADOS.pending;
              return (
                <Link key={p.id} href={`/orders/${p.id}`}
                  className={`flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--surface-2)] transition-colors group ${i < Math.min(pedidos.length, 4) - 1 ? 'border-b border-[var(--border)]' : ''}`}>
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${e.color}`}>
                    <e.icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--blue)] transition-colors">
                      #{p.id?.slice(-8)?.toUpperCase()}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {new Date(p.created_at).toLocaleDateString('es-CO', { day:'2-digit', month:'short' })} · {p.items?.length ?? 0} artículos
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold shrink-0 hidden sm:block ${e.color}`}>{e.label}</span>
                  <span className="text-sm font-black text-[var(--text-primary)] shrink-0">{fmt(p.total)}</span>
                  <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--blue)] group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Accesos rápidos */}
      <motion.div variants={anim}>
        <h2 className="font-bold text-[var(--text-primary)] mb-3">Accesos rápidos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/',          icon: Store,       label: 'Explorar',  desc: 'Tiendas y productos',    color: 'bg-orange-100 text-orange-600' },
            { href: '/orders',    icon: ShoppingBag, label: 'Pedidos',   desc: 'Historial de compras',   color: 'bg-blue-100 text-blue-600'    },
            { href: '/wishlist',  icon: Heart,       label: 'Favoritos', desc: 'Lista de deseos',        color: 'bg-rose-100 text-rose-500'    },
            { href: '/dashboard/profile', icon: Shield, label: 'Perfil', desc: 'Mi cuenta',              color: 'bg-purple-100 text-purple-600' },
          ].map(({ href, icon: Icon, label, desc, color }) => (
            <Link key={href} href={href}
              className="flex flex-col items-center gap-2 bg-white border border-[var(--border)] rounded-2xl p-4 hover:border-[var(--accent-border)] hover:shadow-md transition-all group text-center">
              <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">{label}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

    </motion.div>
  );
}

/* ─── DASHBOARD VENDEDOR ─────────────────────────────────────────────────── */
function DashboardVendedor({ nombre }: { nombre: string }) {
  const [tiendas,  setTiendas]  = useState<any[]>([]);
  const [productos,setProductos]= useState<any[]>([]);
  const [pedidos,  setPedidos]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/stores/my');
        setTiendas(res.data);
        const allProds: any[] = [], allPedidos: any[] = [];
        await Promise.all(res.data.map(async (t: any) => {
          try {
            const [pr, or] = await Promise.all([
              api.get(`/stores/${t.id}/products`),
              api.get(`/orders/store/${t.id}`),
            ]);
            allProds.push(...pr.data);
            allPedidos.push(...or.data);
          } catch {}
        }));
        setProductos(allProds);
        setPedidos(allPedidos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const validos     = pedidos.filter(p => p.status !== 'cancelled' && p.status !== 'refunded');
  const totalIngreso = validos.reduce((s, p) => s + toNum(p.total), 0);
  const pendientes  = pedidos.filter(p => p.status === 'pending').length;
  const stockBajo   = productos.filter(p => p.is_active && p.stock <= 5);
  const activos     = productos.filter(p => p.is_active).length;

  const { Icon: SaludoIcon, text: saludo } = saludoActual();

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">

      {/* Saludo */}
      <motion.div variants={anim} className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-purple-200/50 shrink-0">
          {nombre[0]?.toUpperCase()}
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-semibold bg-purple-50 text-purple-700 border-purple-200 mb-1">
            <Store className="w-3 h-3" /> Vendedor
          </span>
          <h1 className="text-xl md:text-2xl font-black text-[var(--text-primary)] flex items-center gap-2 flex-wrap">
            <SaludoIcon className="w-5 h-5 text-[var(--accent)] shrink-0" strokeWidth={2.5} />
            {saludo}, <span className="text-[var(--accent-dark)]">{nombre.split(' ')[0]}</span>
          </h1>
          <p className="text-sm text-[var(--text-muted)]">Panel de vendedor</p>
        </div>
      </motion.div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={TrendingUp}  label="Ingresos"    value={fmtS(totalIngreso)}  sub={`${validos.length} pedidos`}         color="bg-orange-100 text-orange-600" href="/owner/analytics" />
          <StatCard icon={ShoppingBag} label="Pedidos"     value={pedidos.length}      sub={pendientes > 0 ? `${pendientes} pend.` : 'Al día'}  color="bg-blue-100 text-blue-600"   href="/owner/orders"    />
          <StatCard icon={Store}       label="Tiendas"     value={tiendas.filter(t=>t.is_published).length} sub={`de ${tiendas.length} total`}  color="bg-indigo-100 text-indigo-600" href="/owner/stores" />
          <StatCard icon={Package}     label="Productos"   value={activos}             sub={stockBajo.length > 0 ? `${stockBajo.length} con stock bajo` : 'Inventario al día'} color="bg-green-100 text-green-600" href="/owner/products" />
        </div>
      )}

      {/* Alertas */}
      {!loading && (pendientes > 0 || stockBajo.length > 0) && (
        <motion.div variants={anim} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {pendientes > 0 && (
            <Link href="/owner/orders"
              className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 hover:bg-yellow-100 transition-colors group">
              <div className="w-10 h-10 bg-yellow-100 border border-yellow-200 rounded-xl flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-yellow-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-yellow-800">{pendientes} pedido{pendientes > 1 ? 's' : ''} pendiente{pendientes > 1 ? 's' : ''}</p>
                <p className="text-xs text-yellow-600">Requieren atención urgente</p>
              </div>
              <ChevronRight className="w-4 h-4 text-yellow-600 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
          {stockBajo.length > 0 && (
            <Link href="/owner/products"
              className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 hover:bg-red-100 transition-colors group">
              <div className="w-10 h-10 bg-red-100 border border-red-200 rounded-xl flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-red-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-red-800">{stockBajo.length} producto{stockBajo.length > 1 ? 's' : ''} con stock bajo</p>
                <p className="text-xs text-red-600">Actualiza tu inventario</p>
              </div>
              <ChevronRight className="w-4 h-4 text-red-600 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </motion.div>
      )}

      {/* Pedidos recientes */}
      {!loading && pedidos.length > 0 && (
        <motion.div variants={anim}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[var(--accent)]" /> Últimos pedidos
            </h2>
            <Link href="/owner/orders" className="text-xs text-[var(--blue)] hover:underline flex items-center gap-1 font-medium">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
            {pedidos.slice(0, 5).map((p, i) => {
              const e = ESTADOS[p.status] ?? ESTADOS.pending;
              return (
                <div key={p.id} className={`flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--surface-2)] transition-colors ${i < Math.min(pedidos.length, 5) - 1 ? 'border-b border-[var(--border)]' : ''}`}>
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${e.color}`}>
                    <e.icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">#{p.id?.slice(-8)?.toUpperCase()}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {new Date(p.created_at).toLocaleDateString('es-CO', { day:'2-digit', month:'short' })} · {p.shipping_city}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold hidden sm:block ${e.color}`}>{e.label}</span>
                  <span className="text-sm font-black text-[var(--text-primary)] shrink-0">{fmt(p.total)}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Sin tiendas */}
      {!loading && tiendas.length === 0 && (
        <motion.div variants={anim} className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-10 text-center">
          <Crown className="w-12 h-12 text-[var(--accent)] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">¡Crea tu primera tienda!</h3>
          <p className="text-[var(--text-muted)] mb-5 max-w-sm mx-auto text-sm">Empieza a vender en minutos. Sin comisiones iniciales.</p>
          <Link href="/owner/stores"
            className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold px-6 py-3 rounded-xl text-sm transition-all hover:shadow-md">
            <Plus className="w-4 h-4" /> Nueva tienda gratis
          </Link>
        </motion.div>
      )}

      {/* Accesos rápidos */}
      <motion.div variants={anim}>
        <h2 className="font-bold text-[var(--text-primary)] mb-3">Accesos rápidos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href:'/owner/stores',    icon:Store,       label:'Tiendas',    color:'bg-orange-100 text-orange-600' },
            { href:'/owner/products',  icon:Package,     label:'Productos',  color:'bg-purple-100 text-purple-600' },
            { href:'/owner/orders',    icon:ShoppingBag, label:'Pedidos',    color:'bg-blue-100 text-blue-600'     },
            { href:'/owner/analytics', icon:BarChart3,   label:'Analíticas', color:'bg-green-100 text-green-600'   },
          ].map(({ href, icon: Icon, label, color }) => (
            <Link key={href} href={href}
              className="flex flex-col items-center gap-2 bg-white border border-[var(--border)] rounded-2xl p-4 hover:border-[var(--accent-border)] hover:shadow-md transition-all group text-center">
              <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-[var(--text-primary)]">{label}</p>
            </Link>
          ))}
        </div>
      </motion.div>

    </motion.div>
  );
}

/* ─── DASHBOARD ADMIN ────────────────────────────────────────────────────── */
function DashboardAdmin({ nombre, rol }: { nombre: string; rol: string }) {
  const [tiendas, setTiendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stores').then(r => setTiendas(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const pub     = tiendas.filter(t => t.is_published).length;
  const ocultas = tiendas.filter(t => !t.is_published).length;
  const esteMes = tiendas.filter(t => {
    const d = new Date(t.created_at), now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={anim} className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-2xl font-black text-white shadow-lg shrink-0">
          {nombre[0]?.toUpperCase()}
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-semibold bg-orange-50 text-orange-700 border-orange-200 mb-1">
            <Shield className="w-3 h-3" /> {rol === 'super_admin' ? 'Super Admin' : 'Admin'}
          </span>
          <h1 className="text-xl md:text-2xl font-black text-[var(--text-primary)]">Panel de administración</h1>
          <p className="text-sm text-[var(--text-muted)]">Gestión de la plataforma Shopper</p>
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{[1,2,3,4].map(i=><div key={i} className="skeleton h-28 rounded-2xl"/>)}</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={Store}       label="Total tiendas" value={tiendas.length} sub="En la plataforma"        color="bg-orange-100 text-orange-600" href="/admin/stores" />
          <StatCard icon={CheckCircle} label="Publicadas"    value={pub}            sub="Visibles al público"     color="bg-green-100 text-green-600"   href="/admin/stores" />
          <StatCard icon={AlertCircle} label="Ocultas"       value={ocultas}        sub="No visibles"             color="bg-gray-100 text-gray-600"     href="/admin/stores" />
          <StatCard icon={Zap}         label="Nuevas/mes"    value={esteMes}        sub="Este mes"                color="bg-purple-100 text-purple-600" href="/admin/stores" />
        </div>
      )}

      {!loading && tiendas.length > 0 && (
        <motion.div variants={anim}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[var(--text-primary)]">Tiendas recientes</h2>
            <Link href="/admin/stores" className="text-xs text-[var(--blue)] hover:underline flex items-center gap-1 font-medium">Ver todas <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
            {tiendas.slice(-5).reverse().map((t, i) => (
              <div key={t.id} className={`flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--surface-2)] transition-colors group ${i < 4 ? 'border-b border-[var(--border)]' : ''}`}>
                <div className="w-9 h-9 bg-[var(--accent)] rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0">
                  {t.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate group-hover:text-[var(--accent-dark)] transition-colors">{t.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">/{t.slug}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${t.is_published ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                  {t.is_published ? 'Publicada' : 'Oculta'}
                </span>
                <Link href={`/store/${t.slug}`} target="_blank" className="text-[var(--text-muted)] hover:text-[var(--blue)] transition-colors">
                  <Eye className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div variants={anim}>
        <h2 className="font-bold text-[var(--text-primary)] mb-3">Accesos rápidos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { href:'/admin/stores',       icon:Store,   label:'Gestionar tiendas',  desc:'Publicar y moderar',     color:'bg-orange-100 text-orange-600' },
            { href:'/admin/stores/users', icon:Users,   label:'Usuarios',           desc:'Roles y permisos',       color:'bg-purple-100 text-purple-600' },
            { href:'/',                   icon:Eye,     label:'Ver plataforma',     desc:'Como comprador',         color:'bg-blue-100 text-blue-600'     },
          ].map(({ href, icon: Icon, label, desc, color }) => (
            <Link key={href} href={href}
              className="flex items-center gap-3 bg-white border border-[var(--border)] rounded-2xl p-4 hover:border-[var(--accent-border)] hover:shadow-md transition-all group">
              <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}><Icon className="w-5 h-5" /></div>
              <div><p className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-dark)] transition-colors">{label}</p><p className="text-xs text-[var(--text-muted)]">{desc}</p></div>
              <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent)] group-hover:translate-x-1 transition-all ml-auto" />
            </Link>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── PÁGINA PRINCIPAL ───────────────────────────────────────────────────── */
export default function PaginaDashboard() {
  const { user } = useAuthStore();

  if (!user) return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin mx-auto mb-3" />
        <p className="text-sm text-[var(--text-muted)]">Cargando panel...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {user.role === 'buyer'                                      && <DashboardComprador nombre={user.name} />}
        {user.role === 'owner'                                      && <DashboardVendedor  nombre={user.name} />}
        {(user.role === 'admin' || user.role === 'super_admin')     && <DashboardAdmin     nombre={user.name} rol={user.role} />}
      </div>
    </div>
  );
}
