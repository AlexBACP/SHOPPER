/**
 * Store de notificaciones en tiempo real (Zustand).
 * Persiste en localStorage para que las notificaciones sobrevivan
 * a recargas de página (solo las no leídas).
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Notificacion {
  id:              string;
  tipo:            'nuevo_pedido';
  pedidoId:        string;
  total:           number;
  numProductos:    number;
  compradorNombre: string;
  ciudad:          string;
  timestamp:       string;
  storeId:         string;
  storeName:       string;
  leida:           boolean;
}

interface NotificacionesState {
  notificaciones:       Notificacion[];
  sinLeer:              number;
  agregar:              (n: Omit<Notificacion, 'id' | 'leida'>) => void;
  marcarTodasLeidas:    () => void;
  marcarLeida:          (id: string) => void;
  limpiar:              () => void;
}

export const useNotificacionesStore = create<NotificacionesState>()(
  persist(
    (set) => ({
      notificaciones: [],
      sinLeer:        0,

      agregar(datos) {
        const nueva: Notificacion = {
          ...datos,
          id:    crypto.randomUUID(),
          leida: false,
        };
        set((s) => ({
          notificaciones: [nueva, ...s.notificaciones].slice(0, 50), // máx 50
          sinLeer: s.sinLeer + 1,
        }));
      },

      marcarLeida(id) {
        set((s) => {
          const notif = s.notificaciones.find((n) => n.id === id);
          if (!notif || notif.leida) return s;
          return {
            notificaciones: s.notificaciones.map((n) =>
              n.id === id ? { ...n, leida: true } : n,
            ),
            sinLeer: Math.max(0, s.sinLeer - 1),
          };
        });
      },

      marcarTodasLeidas() {
        set((s) => ({
          notificaciones: s.notificaciones.map((n) => ({ ...n, leida: true })),
          sinLeer: 0,
        }));
      },

      limpiar() {
        set({ notificaciones: [], sinLeer: 0 });
      },
    }),
    {
      name: 'shopper-notificaciones',
      // Solo persistir las últimas 20 notificaciones
      partialize: (s) => ({
        notificaciones: s.notificaciones.slice(0, 20),
        sinLeer:        s.sinLeer,
      }),
    },
  ),
);
