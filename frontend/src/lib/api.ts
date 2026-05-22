import axios from 'axios';
import { COOKIE_CONFIG, API_ENDPOINTS } from '@/config/constants';

// Endpoints de API que no necesitan Authorization header
const API_PUBLIC_ROUTES = ['/auth/login', '/auth/register', '/auth/refresh'] as const;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Helpers de localStorage ───────────────────────────────────────────
const AUTH_STORE_KEY = 'shopper-auth';

function getAuthState(): { accessToken: string | null; refreshToken: string | null } {
  if (typeof window === 'undefined') return { accessToken: null, refreshToken: null };
  try {
    const raw    = localStorage.getItem(AUTH_STORE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return {
      accessToken:  parsed?.state?.accessToken  ?? null,
      refreshToken: parsed?.state?.refreshToken ?? null,
    };
  } catch {
    return { accessToken: null, refreshToken: null };
  }
}

function updateStoredTokens(accessToken: string, refreshToken: string) {
  try {
    const raw    = localStorage.getItem(AUTH_STORE_KEY);
    const parsed = raw ? JSON.parse(raw) : { state: {} };
    parsed.state.accessToken  = accessToken;
    parsed.state.refreshToken = refreshToken;
    localStorage.setItem(AUTH_STORE_KEY, JSON.stringify(parsed));
  } catch { /* el store de zustand lo manejará */ }
}

function isPublicRoute(url: string | undefined): boolean {
  return API_PUBLIC_ROUTES.some(route => url?.includes(route));
}

// ── Request interceptor ───────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const { accessToken } = getAuthState();
  if (accessToken && !isPublicRoute(config.url)) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ── Response interceptor (refresh token automático) ───────────────────
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (!error.response || error.response.status !== 401) return Promise.reject(error);
    if (original._retry)                                   return Promise.reject(error);
    if (isPublicRoute(original.url))                       return Promise.reject(error);

    original._retry = true;

    try {
      const { refreshToken } = getAuthState();
      if (!refreshToken) throw new Error('No refresh token');

      const { data } = await axios.post(
        `${API_URL}${API_ENDPOINTS.refresh}`,
        {},
        { headers: { 'x-refresh-token': refreshToken } },
      );

      updateStoredTokens(data.accessToken, data.refreshToken);
      document.cookie = `accessToken=${data.accessToken}; ${COOKIE_CONFIG}`;
      original.headers.Authorization = `Bearer ${data.accessToken}`;

      return api(original);
    } catch (err) {
      localStorage.removeItem(AUTH_STORE_KEY);
      document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax';
      window.location.href = '/auth/login';
      return Promise.reject(err);
    }
  },
);

export default api;
