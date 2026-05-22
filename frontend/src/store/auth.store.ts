// src/store/auth.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  hydrate: () => void;
}

// ── Cookie para el middleware de Next.js ──────────────────
function setAuthCookie(token: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `accessToken=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

function clearAuthCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax';
}

// ── Store ─────────────────────────────────────────────────
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:         null,
      accessToken:  null,
      refreshToken: null,

      setAuth: (user, accessToken, refreshToken) => {
        setAuthCookie(accessToken);
        set({ user, accessToken, refreshToken });
      },

      logout: () => {
        clearAuthCookie();
        set({ user: null, accessToken: null, refreshToken: null });
      },

      isAuthenticated: () => !!get().accessToken,

      // Mantenemos hydrate() para compatibilidad con código existente.
      // Con persist, ya no es necesario llamarlo manualmente.
      hydrate: () => {
        const token = get().accessToken;
        if (token) setAuthCookie(token);
      },
    }),
    {
      name:    'shopper-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user:         state.user,
        accessToken:  state.accessToken,
        refreshToken: state.refreshToken,
      }),
      // Re-sincroniza la cookie del middleware al rehidratar
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          setAuthCookie(state.accessToken);
        }
      },
    },
  ),
);
