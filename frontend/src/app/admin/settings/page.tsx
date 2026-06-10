'use client';

import { useEffect, useState } from 'react';
import { Settings, Loader2, Save, ShieldAlert, Truck, Percent, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { handleApiError } from '@/lib/errors';
import { useAuthStore } from '@/store/auth.store';

interface PlatformSettings {
  free_shipping_threshold?: string;
  default_commission_pct?: string;
  featured_coupon?: string;
}

export default function AdminSettingsPage() {
  const { user } = useAuthStore();
  const esSuper = user?.role === 'super_admin';

  const [settings, setSettings] = useState<PlatformSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!esSuper) { setLoading(false); return; }
    api.get<PlatformSettings>('/admin/settings')
      .then(r => setSettings(r.data))
      .catch(e => handleApiError(e, 'No se pudo cargar la configuración.'))
      .finally(() => setLoading(false));
  }, [esSuper]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await api.patch<PlatformSettings>('/admin/settings', settings);
      setSettings(r.data);
      toast.success('Configuración guardada ✅');
    } catch (err) { handleApiError(err, 'No se pudo guardar.'); }
    finally { setSaving(false); }
  };

  const set = (k: keyof PlatformSettings, v: string) => setSettings(s => ({ ...s, [k]: v }));

  if (!esSuper) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <ShieldAlert className="h-10 w-10 text-[var(--ink-soft)]" />
        <h1 className="mt-4 text-xl font-bold text-[var(--ink)]">Solo para super administradores</h1>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">Esta sección está reservada para la cuenta super_admin.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-[var(--ink-soft)]"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const fmtUmbral = settings.free_shipping_threshold
    ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(settings.free_shipping_threshold))
    : '';

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-8">
      <header className="mb-6 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--bone-3)] text-[var(--primary)]"><Settings className="h-5 w-5" /></span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink)]" style={{ fontFamily: 'var(--font-display)' }}>Configuración</h1>
          <p className="text-sm text-[var(--ink-soft)]">Ajustes globales de la plataforma — solo super_admin.</p>
        </div>
      </header>

      <form onSubmit={guardar} className="space-y-5 rounded-2xl border border-[var(--line)] bg-[var(--bone-2)] p-6">
        {/* Envío gratis */}
        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
            <Truck className="h-4 w-4 text-[var(--selva)]" /> Umbral de envío gratis (COP)
          </label>
          <input
            type="number" min={0} step={1000}
            value={settings.free_shipping_threshold ?? ''}
            onChange={e => set('free_shipping_threshold', e.target.value)}
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--bone)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
          />
          <p className="mt-1 text-[12px] text-[var(--ink-soft)]">Compras iguales o mayores a {fmtUmbral || '—'} no pagan envío. (Se aplica en el checkout.)</p>
        </div>

        {/* Comisión por defecto */}
        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
            <Percent className="h-4 w-4 text-[var(--primary)]" /> Comisión por defecto (%)
          </label>
          <input
            type="number" min={0} max={100}
            value={settings.default_commission_pct ?? ''}
            onChange={e => set('default_commission_pct', e.target.value)}
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--bone)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
          />
          <p className="mt-1 text-[12px] text-[var(--ink-soft)]">Comisión del plan gratuito (referencia para los planes).</p>
        </div>

        {/* Cupón destacado */}
        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
            <Ticket className="h-4 w-4 text-[var(--primary)]" /> Cupón destacado (opcional)
          </label>
          <input
            type="text"
            value={settings.featured_coupon ?? ''}
            onChange={e => set('featured_coupon', e.target.value.toUpperCase())}
            placeholder="Ej. BIENVENIDO"
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--bone)] px-3 py-2.5 text-sm uppercase outline-none focus:border-[var(--primary)]"
          />
          <p className="mt-1 text-[12px] text-[var(--ink-soft)]">Código a promocionar en la plataforma.</p>
        </div>

        <button type="submit" disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--ink)] px-6 py-2.5 text-sm font-semibold text-[var(--bone-2)] transition-all hover:bg-[var(--primary-2)] disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar cambios
        </button>
      </form>
    </div>
  );
}
