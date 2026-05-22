'use client';

/**
 * NotificacionesProvider
 * ─────────────────────
 * Se monta una sola vez en layout.tsx y gestiona la conexión
 * Socket.io al namespace /notificaciones del backend.
 *
 * Solo se conecta si el usuario es owner o admin.
 * Al recibir `nuevo:pedido` muestra un toast dorado y actualiza el store.
 */

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';
import { useNotificacionesStore, Notificacion } from '@/store/notifications.store';
import { ShoppingBag } from 'lucide-react';
import React from 'react';

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type PayloadServidor = Omit<Notificacion, 'id' | 'leida' | 'tipo'>;

function formatCOP(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}k`;
  return `$${n.toLocaleString('es-CO')}`;
}

export default function NotificacionesProvider(): null {
  const { user, accessToken } = useAuthStore();
  const agregar = useNotificacionesStore((s) => s.agregar);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Solo conectar para owners y admins
    const rolesConNotificaciones = ['owner', 'admin', 'super_admin'];
    if (!user || !accessToken || !rolesConNotificaciones.includes(user.role)) {
      return;
    }

    // Conectar al namespace de notificaciones
    const socket = io(`${BACKEND}/notificaciones`, {
      auth:          { token: accessToken },
      transports:    ['websocket', 'polling'],
      reconnection:  true,
      reconnectionAttempts: 5,
      reconnectionDelay:    2000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.info('[Notificaciones] Conectado al servidor');
    });

    socket.on('connect_error', (err) => {
      console.warn('[Notificaciones] Error de conexión:', err.message);
    });

    socket.on('nuevo:pedido', (payload: PayloadServidor) => {
      // 1. Guardar en el store
      agregar({ tipo: 'nuevo_pedido', ...payload });

      // 2. Mostrar toast con diseño dorado
      toast(
        React.createElement(
          'div',
          { className: 'flex items-start gap-3' },
          React.createElement(
            'div',
            { className: 'w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5' },
            React.createElement(ShoppingBag, { className: 'w-4 h-4 text-amber-400' }),
          ),
          React.createElement(
            'div',
            {},
            React.createElement('p', { className: 'text-sm font-semibold text-white mb-0.5' }, '¡Nuevo pedido!'),
            React.createElement(
              'p',
              { className: 'text-xs text-zinc-400' },
              `${payload.storeName} · ${formatCOP(payload.total)} · ${payload.compradorNombre}`,
            ),
          ),
        ),
        {
          duration: 6000,
          style: {
            background: '#111113',
            border:     '1px solid #27272a',
            borderLeft: '3px solid #f59e0b',
            padding:    '12px 14px',
          },
        },
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, accessToken, agregar]);

  return null;
}
