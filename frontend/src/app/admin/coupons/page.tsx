'use client';

import { useEffect, useState } from 'react';
import { Ticket, Plus, Trash2, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { handleApiError } from '@/lib/errors';

interface Coupon {
  id: string;
  code: string;
  discount_pct: number;
  is_active: boolean;
  max_uses: number | null;
  times_used: number;
  expires_at: string | null;
  created_at: string;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // form
  const [code, setCode] = useState('');
  const [pct, setPct] = useState(10);
  const [maxUses, setMaxUses] = useState('');
  const [expires, setExpires] = useState('');

  const cargar = () => {
    setLoading(true);
    api.get<Coupon[]>('/coupons')
      .then(r => setCoupons(r.data))
      .catch(e => handleApiError(e, 'No se pudieron cargar los cupones.'))
      .finally(() => setLoading(false));
  };
  useEffect(cargar, []);

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) { toast.error('Escribe un código'); return; }
    setCreating(true);
    try {
      await api.post('/coupons', {
        code: code.trim().toUpperCase(),
        discount_pct: pct,
        max_uses: maxUses ? Number(maxUses) : undefined,
        expires_at: expires ? new Date(expires).toISOString() : undefined,
      });
      toast.success('Cupón creado ✅');
      setCode(''); setPct(10); setMaxUses(''); setExpires('');
      cargar();
    } catch (err) { handleApiError(err, 'No se pudo crear el cupón.'); }
    finally { setCreating(false); }
  };

  const toggle = async (c: Coupon) => {
    try {
      await api.patch(`/coupons/${c.id}`, { is_active: !c.is_active });
      setCoupons(cs => cs.map(x => x.id === c.id ? { ...x, is_active: !x.is_active } : x));
    } catch (err) { handleApiError(err, 'No se pudo actualizar.'); }
  };

  const borrar = async (c: Coupon) => {
    if (!confirm(`¿Eliminar el cupón ${c.code}?`)) return;
    try {
      await api.delete(`/coupons/${c.id}`);
      setCoupons(cs => cs.filter(x => x.id !== c.id));
      toast.success('Cupón eliminado');
    } catch (err) { handleApiError(err, 'No se pudo eliminar.'); }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <header className="mb-6 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--bone-3)] text-[var(--primary)]"><Ticket className="h-5 w-5" /></span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink)]" style={{ fontFamily: 'var(--font-display)' }}>Cupones</h1>
          <p className="text-sm text-[var(--ink-soft)]">Crea y administra los descuentos de la plataforma.</p>
        </div>
      </header>

      {/* Crear */}
      <form onSubmit={crear} className="mb-8 grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--bone-2)] p-5 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <label className="mb-1 block text-[12px] font-semibold text-[var(--ink-soft)]">Código</label>
          <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="VERANO20"
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--bone)] px-3 py-2 text-sm font-semibold uppercase outline-none focus:border-[var(--primary)]" />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[var(--ink-soft)]">Descuento %</label>
          <input type="number" min={1} max={100} value={pct} onChange={e => setPct(Number(e.target.value))}
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--bone)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[var(--ink-soft)]">Usos máx. (opc.)</label>
          <input type="number" min={1} value={maxUses} onChange={e => setMaxUses(e.target.value)} placeholder="∞"
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--bone)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[var(--ink-soft)]">Vence (opc.)</label>
          <input type="date" value={expires} onChange={e => setExpires(e.target.value)}
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--bone)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" />
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={creating}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-[var(--bone-2)] transition-all hover:bg-[var(--primary-2)] disabled:opacity-60">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Crear
          </button>
        </div>
      </form>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12 text-[var(--ink-soft)]"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : coupons.length === 0 ? (
        <p className="py-12 text-center text-sm text-[var(--ink-soft)]">Aún no hay cupones. Crea el primero arriba.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--line)]">
          <table className="w-full text-left text-[13.5px]">
            <thead className="bg-[var(--bone-3)] text-[12px] uppercase tracking-wide text-[var(--ink-soft)]">
              <tr>
                <th className="p-3 font-semibold">Código</th>
                <th className="p-3 font-semibold">Descuento</th>
                <th className="p-3 font-semibold">Usos</th>
                <th className="p-3 font-semibold">Vence</th>
                <th className="p-3 font-semibold">Estado</th>
                <th className="p-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.id} className="border-t border-[var(--line)]">
                  <td className="p-3 font-bold tracking-wide text-[var(--ink)]">{c.code}</td>
                  <td className="p-3 text-[var(--ink)]">{c.discount_pct}%</td>
                  <td className="p-3 text-[var(--ink-soft)]">{c.times_used}{c.max_uses ? ` / ${c.max_uses}` : ''}</td>
                  <td className="p-3 text-[var(--ink-soft)]">{c.expires_at ? new Date(c.expires_at).toLocaleDateString('es-CO') : '—'}</td>
                  <td className="p-3">
                    <button onClick={() => toggle(c)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${c.is_active ? 'bg-[var(--selva-soft)] text-[var(--selva)]' : 'bg-[var(--bone-3)] text-[var(--ink-soft)]'}`}>
                      {c.is_active ? <><Check className="h-3.5 w-3.5" /> Activo</> : <><X className="h-3.5 w-3.5" /> Inactivo</>}
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => borrar(c)} className="rounded-lg p-2 text-[var(--ink-soft)] transition-colors hover:bg-red-50 hover:text-red-600" title="Eliminar">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
