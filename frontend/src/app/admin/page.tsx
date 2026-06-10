'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, Store, Package, ShoppingBag, DollarSign, TrendingUp, Loader2, ExternalLink,
} from 'lucide-react';
import api from '@/lib/api';
import { handleApiError } from '@/lib/errors';

interface AdminStats {
  usuarios:   { total: number; buyers: number; owners: number; admins: number };
  tiendas:    { total: number; publicadas: number };
  productos:  number;
  pedidos:    { total: number; porEstado: Record<string, number> };
  ingresos:   number;
  topTiendas: { id: string; name: string; slug: string; pedidos: number; ventas: number }[];
  recientes:  { id: string; total: number; status: string; created_at: string; comprador: string }[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

const ESTADOS: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pendiente',  color: '#b08900' },
  confirmed:  { label: 'Confirmado', color: '#2f5d4f' },
  processing: { label: 'Procesando', color: '#3a7060' },
  shipped:    { label: 'Enviado',    color: '#2563eb' },
  delivered:  { label: 'Entregado',  color: '#16a34a' },
  cancelled:  { label: 'Cancelado',  color: '#b91c1c' },
  refunded:   { label: 'Reembolsado',color: '#9333ea' },
};

export default function AdminDashboardPage() {
  const [stats, setStats]   = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<AdminStats>('/admin/stats')
      .then(r => setStats(r.data))
      .catch(e => handleApiError(e, 'No se pudieron cargar las métricas.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[var(--ink-soft)]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (!stats) return null;

  const KPIS = [
    { label: 'Ingresos',  value: fmt(stats.ingresos),          icon: DollarSign, accent: 'var(--selva)' },
    { label: 'Pedidos',   value: stats.pedidos.total,          icon: ShoppingBag, accent: 'var(--primary)' },
    { label: 'Usuarios',  value: stats.usuarios.total,         icon: Users,       accent: 'var(--ink)' },
    { label: 'Tiendas',   value: `${stats.tiendas.publicadas}/${stats.tiendas.total}`, icon: Store, accent: 'var(--primary-2)' },
    { label: 'Productos', value: stats.productos,              icon: Package,     accent: 'var(--selva)' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <header className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink)]" style={{ fontFamily: 'var(--font-display)' }}>
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">Resumen de la plataforma en tiempo real.</p>
      </header>

      {/* KPIs */}
      <motion.div
        initial="hidden" animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
        className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5"
      >
        {KPIS.map(k => {
          const Icon = k.icon;
          return (
            <motion.div
              key={k.label}
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
              className="rounded-2xl border border-[var(--line)] bg-[var(--bone-2)] p-5"
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: 'var(--bone-3)', color: k.accent }}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="mt-3 text-2xl font-extrabold tracking-tight text-[var(--ink)]" style={{ fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}>
                {k.value}
              </div>
              <div className="mt-0.5 text-[12px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]">{k.label}</div>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Pedidos por estado */}
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--bone-2)] p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-[var(--ink-soft)]">Pedidos por estado</h2>
          <div className="space-y-2.5">
            {Object.entries(stats.pedidos.porEstado).length === 0 && (
              <p className="text-sm text-[var(--ink-soft)]">Aún no hay pedidos.</p>
            )}
            {Object.entries(stats.pedidos.porEstado).map(([estado, n]) => {
              const cfg = ESTADOS[estado] ?? { label: estado, color: 'var(--ink-soft)' };
              const pct = stats.pedidos.total ? Math.round((n / stats.pedidos.total) * 100) : 0;
              return (
                <div key={estado}>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-semibold text-[var(--ink)]">{cfg.label}</span>
                    <span className="text-[var(--ink-soft)]">{n} · {pct}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--bone-3)]">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cfg.color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex gap-4 border-t border-[var(--line)] pt-4 text-[13px] text-[var(--ink-soft)]">
            <span><strong className="text-[var(--ink)]">{stats.usuarios.buyers}</strong> compradores</span>
            <span><strong className="text-[var(--ink)]">{stats.usuarios.owners}</strong> vendedores</span>
            <span><strong className="text-[var(--ink)]">{stats.usuarios.admins}</strong> admins</span>
          </div>
        </section>

        {/* Top tiendas */}
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--bone-2)] p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[var(--ink-soft)]">
            <TrendingUp className="h-4 w-4 text-[var(--primary)]" /> Top tiendas por ventas
          </h2>
          {stats.topTiendas.length === 0 ? (
            <p className="text-sm text-[var(--ink-soft)]">Aún no hay ventas registradas.</p>
          ) : (
            <ol className="space-y-3">
              {stats.topTiendas.map((t, i) => (
                <li key={t.id} className="flex items-center gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--bone-3)] text-[12px] font-bold text-[var(--ink)]">{i + 1}</span>
                  <Link href={`/store/${t.slug}`} className="flex-1 truncate text-[14px] font-semibold text-[var(--ink)] hover:text-[var(--primary)]">
                    {t.name}
                  </Link>
                  <span className="text-[13px] text-[var(--ink-soft)]">{t.pedidos} ped.</span>
                  <span className="w-28 text-right text-[13px] font-bold text-[var(--ink)]" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(t.ventas)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {/* Pedidos recientes */}
      <section className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--bone-2)] p-6">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-[var(--ink-soft)]">Pedidos recientes</h2>
        {stats.recientes.length === 0 ? (
          <p className="text-sm text-[var(--ink-soft)]">Aún no hay pedidos.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13.5px]">
              <thead>
                <tr className="text-[12px] uppercase tracking-wide text-[var(--ink-soft)]">
                  <th className="pb-2 font-semibold">Pedido</th>
                  <th className="pb-2 font-semibold">Comprador</th>
                  <th className="pb-2 font-semibold">Estado</th>
                  <th className="pb-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {stats.recientes.map(o => {
                  const cfg = ESTADOS[o.status] ?? { label: o.status, color: 'var(--ink-soft)' };
                  return (
                    <tr key={o.id} className="border-t border-[var(--line)]">
                      <td className="py-2.5 font-mono text-[12px] text-[var(--ink-soft)]">#{o.id.slice(0, 8)}</td>
                      <td className="py-2.5 text-[var(--ink)]">{o.comprador}</td>
                      <td className="py-2.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold" style={{ background: `${cfg.color}1a`, color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-bold text-[var(--ink)]" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(o.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Link href="/admin/stores" className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--primary)] hover:underline">
          Ver todas las tiendas <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </section>
    </div>
  );
}
