/**
 * @file page.tsx
 * @description Página de callback OAuth.
 *              El backend redirige aquí después de Google / Facebook con
 *              los tokens como query params:
 *              /auth/callback?access_token=xxx&refresh_token=yyy
 *
 *              También maneja errores:
 *              /auth/callback?error=apple_not_configured
 * @module auth/callback
 */
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';

// ─── Mensajes de error legibles ───────────────────────────────────────────────

const MENSAJES_ERROR: Record<string, string> = {
  apple_not_configured: 'El inicio de sesión con Apple aún no está disponible.',
  access_denied:        'Cancelaste el inicio de sesión.',
  default:              'Ocurrió un error durante el inicio de sesión.',
};

// ─── Página principal ─────────────────────────────────────────────────────────

export default function PaginaCallbackOAuth(): React.ReactElement {
  const router       = useRouter();
  const params       = useSearchParams();
  const setAuth      = useAuthStore((s) => s.setAuth);
  const [estado, setEstado] = useState<'cargando' | 'error'>('cargando');
  const [mensajeError, setMensajeError] = useState('');

  useEffect(() => {
    const accessToken  = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const error        = params.get('error');

    // ── Caso error ─────────────────────────────────────────────────────────
    if (error) {
      const mensaje = MENSAJES_ERROR[error] ?? MENSAJES_ERROR.default;
      setMensajeError(mensaje);
      setEstado('error');
      toast.error(mensaje);
      setTimeout(() => router.replace('/auth/login'), 3000);
      return;
    }

    // ── Caso sin tokens ────────────────────────────────────────────────────
    if (!accessToken || !refreshToken) {
      setMensajeError(MENSAJES_ERROR.default);
      setEstado('error');
      setTimeout(() => router.replace('/auth/login'), 3000);
      return;
    }

    // ── Caso éxito ─────────────────────────────────────────────────────────
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1])) as {
        sub:   string;
        email: string;
        role:  string;
        name?: string;
      };

      const user = {
        id:    payload.sub,
        email: payload.email,
        role:  payload.role as 'buyer' | 'super_admin' | 'admin' | 'owner',
        name:  payload.name ?? '',
      };

      setAuth(user, accessToken, refreshToken);
      toast.success('¡Bienvenido a Shopper!');

      // Redirigir según el rol
      let destino = '/dashboard';
      if (user.role === 'admin' || user.role === 'super_admin') destino = '/admin/stores';
      else if (user.role === 'owner') destino = '/owner';

      setTimeout(() => router.replace(destino), 600);
    } catch {
      setMensajeError('No se pudo leer la información de la sesión.');
      setEstado('error');
      setTimeout(() => router.replace('/auth/login'), 3000);
    }
  }, [params, router, setAuth]);

  return (
    <div className="min-h-screen bg-[var(--bg)] patron-grilla flex items-center justify-center p-4">
      {/* Blobs decorativos */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-amber-500/[0.05] blur-[130px] animar-float-suave" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-amber-600/[0.04] blur-[110px] animar-float" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center gap-5 text-center max-w-sm"
      >
        {estado === 'cargando' ? (
          <>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center shadow-[0_0_32px_rgba(245,158,11,0.35)]">
              <Loader2 className="w-8 h-8 text-[#09090b] animate-spin" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)] mb-1">
                Iniciando sesión
              </h1>
              <p className="text-sm text-[var(--text-muted)]">
                Verificando tu cuenta…
              </p>
            </div>
            {/* Barra de progreso animada */}
            <div className="w-48 h-1 bg-[var(--surface-3)] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[var(--accent)] rounded-full"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-[var(--danger-subtle)] border border-[var(--danger-border)] flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-[var(--danger)]" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)] mb-1">
                Error de autenticación
              </h1>
              <p className="text-sm text-[var(--text-muted)]">{mensajeError}</p>
              <p className="text-xs text-[var(--text-muted)] mt-2">
                Redirigiendo al inicio de sesión…
              </p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
