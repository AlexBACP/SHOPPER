'use client';

import { useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── Helpers JWT (sin verificar firma — sólo leer claims) ─────────────────────

function obtenerExpiracion(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function estaVencido(token: string): boolean {
  const exp = obtenerExpiracion(token);
  return exp === null || exp < Date.now();
}

// ─── AuthProvider ─────────────────────────────────────────────────────────────

/**
 * AuthProvider — monta antes que cualquier página y:
 *  1. Espera a que Zustand hidrate desde localStorage.
 *  2. Si el accessToken está vencido, intenta refresh silencioso.
 *  3. Si el refresh también está vencido o falla → logout automático.
 *  4. Programa un refresh proactivo 2 minutos antes de que venza el token activo.
 *
 * Renderiza los children de inmediato (SSR-friendly) y resuelve la sesión en
 * segundo plano. Las rutas protegidas las cubre el middleware del servidor.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Programa el siguiente refresh proactivo cuando falten 2 min para vencer
    const programarRefresh = (token: string): void => {
      const exp = obtenerExpiracion(token);
      if (!exp) return;

      const msRestantes = exp - Date.now() - 2 * 60 * 1000; // 2 min de margen
      if (msRestantes <= 0) return;

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(async () => {
        const { refreshToken, user, logout, setAuth } = useAuthStore.getState();
        if (!refreshToken || !user) return;

        try {
          const { data } = await axios.post(
            `${API_URL}/auth/refresh`,
            {},
            { headers: { 'x-refresh-token': refreshToken } },
          );
          setAuth(user, data.accessToken, data.refreshToken);
          programarRefresh(data.accessToken);
        } catch {
          // El refresh falló → sesión expirada → logout y redirigir
          logout();
          window.location.href = '/auth/login';
        }
      }, msRestantes);
    };

    const inicializar = async (): Promise<void> => {
      // 1. Esperar hidratación de Zustand (asíncrona en primera carga)
      if (!useAuthStore.persist.hasHydrated()) {
        await new Promise<void>((resolve) => {
          const cancelar = useAuthStore.persist.onFinishHydration(() => {
            cancelar();
            resolve();
          });
        });
      }

      const { accessToken, refreshToken, user, logout, setAuth } = useAuthStore.getState();

      // 2. Sin sesión → nada que hacer
      if (!accessToken || !user) {
        return;
      }

      // 3. Verificar si el accessToken está vencido
      if (estaVencido(accessToken)) {
        // Si el refreshToken también está vencido → logout inmediato
        if (!refreshToken || estaVencido(refreshToken)) {
          logout();
          return;
        }

        // Intentar renovar silenciosamente
        try {
          const { data } = await axios.post(
            `${API_URL}/auth/refresh`,
            {},
            { headers: { 'x-refresh-token': refreshToken } },
          );
          setAuth(user, data.accessToken, data.refreshToken);
          programarRefresh(data.accessToken);
        } catch {
          // Refresh falló → logout limpio (sin redirigir, el usuario ya está en alguna página)
          logout();
        }
      } else {
        // Token vigente → programar refresh proactivo
        programarRefresh(accessToken);
      }
    };

    inicializar();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return <>{children}</>;
}
