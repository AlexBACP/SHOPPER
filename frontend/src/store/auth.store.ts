import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@/types';
import { COOKIE_CONFIG } from '@/config/constants';

interface AuthState {
  user:         User | null;
  accessToken:  string | null;
  refreshToken: string | null;
  setAuth:         (user: User, accessToken: string, refreshToken: string) => void;
  logout:          () => void;
  isAuthenticated: () => boolean;
}

function setAuthCookie(token: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `accessToken=${token}; ${COOKIE_CONFIG}`;
}

function clearAuthCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax';
}

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
    }),
    {
      name:    'shopper-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user:         state.user,
        accessToken:  state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) setAuthCookie(state.accessToken);
      },
    },
  ),
);
