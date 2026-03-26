import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, accessToken });
  },

  logout: () => {
    localStorage.clear();
    set({ user: null, accessToken: null });
  },

  isAuthenticated: () => !!get().accessToken,

  // Recupera sesión al recargar la página
  hydrate: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('accessToken');
    const raw = localStorage.getItem('user');
    if (token && raw) {
      set({ accessToken: token, user: JSON.parse(raw) });
    }
  },
}));