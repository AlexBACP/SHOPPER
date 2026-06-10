'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, Shield, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { handleApiError } from '@/lib/errors';

/* Activar / desactivar autenticación en dos pasos (TOTP) desde el perfil. */
export default function TwoFactorSettings() {
  const [enabled, setEnabled] = useState<boolean | null>(null); // null = cargando
  const [qr, setQr]   = useState<string | null>(null);          // data URL del QR (modo setup)
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/auth/2fa/status')
      .then(r => setEnabled(!!r.data.enabled))
      .catch(() => setEnabled(false));
  }, []);

  const onlyDigits = (v: string) => v.replace(/\D/g, '').slice(0, 6);

  const startSetup = async () => {
    setBusy(true);
    try {
      const r = await api.post('/auth/2fa/setup');
      setQr(r.data.qr);
    } catch (e) { handleApiError(e, 'No se pudo iniciar la configuración.'); }
    finally { setBusy(false); }
  };

  const confirmEnable = async () => {
    if (code.length < 6) { toast.error('Ingresa el código de 6 dígitos'); return; }
    setBusy(true);
    try {
      await api.post('/auth/2fa/enable', { code });
      toast.success('Autenticación en dos pasos activada ✅');
      setEnabled(true); setQr(null); setCode('');
    } catch (e) { handleApiError(e, 'Código incorrecto. Revisa tu app.'); }
    finally { setBusy(false); }
  };

  const disable = async () => {
    if (code.length < 6) { toast.error('Ingresa un código de tu app para desactivar'); return; }
    setBusy(true);
    try {
      await api.post('/auth/2fa/disable', { code });
      toast.success('Autenticación en dos pasos desactivada');
      setEnabled(false); setCode('');
    } catch (e) { handleApiError(e, 'Código incorrecto.'); }
    finally { setBusy(false); }
  };

  const codeInput = (
    <input
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      value={code}
      onChange={e => setCode(onlyDigits(e.target.value))}
      placeholder="123456"
      className="w-36 rounded-lg border border-[var(--line)] bg-[var(--bone-2)] px-3 py-2 text-center font-bold tracking-[.3em] text-[var(--ink)] outline-none focus:border-[var(--primary)]"
    />
  );

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--bone-2)] p-6">
      <div className="flex items-start gap-4">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${enabled ? 'bg-[var(--selva-soft)] text-[var(--selva)]' : 'bg-[var(--bone-3)] text-[var(--ink-soft)]'}`}>
          {enabled ? <ShieldCheck className="h-6 w-6" /> : <Shield className="h-6 w-6" />}
        </span>
        <div className="flex-1">
          <h3 className="text-[16px] font-bold text-[var(--ink)]" style={{ fontFamily: 'var(--font-display)' }}>
            Verificación en dos pasos (2FA)
          </h3>
          <p className="mt-1 text-[13.5px] leading-snug text-[var(--ink-soft)]">
            Añade una capa extra de seguridad: además de tu contraseña, pedirá un código de tu
            app autenticadora (Google Authenticator, Authy…).
          </p>

          {/* Estado */}
          <div className="mt-3 text-[13px] font-semibold">
            {enabled === null
              ? <span className="text-[var(--ink-soft)]">Cargando…</span>
              : enabled
                ? <span className="inline-flex items-center gap-1.5 text-[var(--selva)]"><Check className="h-4 w-4" /> Activado</span>
                : <span className="inline-flex items-center gap-1.5 text-[var(--ink-soft)]"><X className="h-4 w-4" /> Desactivado</span>}
          </div>
        </div>
      </div>

      {/* Acciones */}
      {enabled === false && !qr && (
        <button
          type="button"
          onClick={startSetup}
          disabled={busy}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-semibold text-[var(--bone-2)] transition-all hover:bg-[var(--primary-2)] disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
          Activar 2FA
        </button>
      )}

      {/* Modo setup: QR + código */}
      {qr && (
        <div className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--bone)] p-5">
          <ol className="space-y-3 text-[13.5px] text-[var(--ink)]">
            <li><strong>1.</strong> Escanea este QR con tu app autenticadora:</li>
          </ol>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="Código QR para 2FA" width={180} height={180} className="my-4 rounded-lg border border-[var(--line)]" />
          <p className="text-[13.5px] text-[var(--ink)]"><strong>2.</strong> Ingresa el código de 6 dígitos que aparece:</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {codeInput}
            <button type="button" onClick={confirmEnable} disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--bone-2)] transition-all hover:bg-[var(--primary-2)] disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Confirmar y activar
            </button>
            <button type="button" onClick={() => { setQr(null); setCode(''); }} className="text-sm text-[var(--ink-soft)] hover:underline">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Desactivar (cuando está activo) */}
      {enabled === true && (
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[var(--line)] pt-5">
          <span className="text-[13px] text-[var(--ink-soft)]">Para desactivar, ingresa un código de tu app:</span>
          {codeInput}
          <button type="button" onClick={disable} disabled={busy}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--ink)] px-5 py-2.5 text-sm font-semibold text-[var(--ink)] transition-all hover:bg-[var(--ink)] hover:text-[var(--bone-2)] disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Desactivar 2FA
          </button>
        </div>
      )}
    </div>
  );
}
