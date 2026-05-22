import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});


// 🧠 Rutas públicas (NO usar refresh aquí)
const PUBLIC_ROUTES = ['/auth/login', '/auth/register', '/auth/refresh'];


// ── Helper: lee el accessToken desde el JSON que persiste Zustand ──
// Zustand/persist guarda todo bajo la key 'shopper-auth', NO como
// 'accessToken' directamente. Leer la key equivocada siempre da null.
function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('shopper-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.accessToken ?? null;
  } catch {
    return null;
  }
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('shopper-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.refreshToken ?? null;
  } catch {
    return null;
  }
}

// ✅ REQUEST INTERCEPTOR
api.interceptors.request.use((config) => {
  const token = getAccessToken();

  // ❌ No meter token en rutas públicas
  if (token && !PUBLIC_ROUTES.some((route) => config.url?.includes(route))) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


// ✅ RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (res) => res,

  async (error) => {
    const original = error.config;

    // ❌ Si no hay response o no es 401 → salir
    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    // ❌ Evitar loop infinito
    if (original._retry) {
      return Promise.reject(error);
    }

    // ❌ No intentar refresh en rutas públicas
    if (PUBLIC_ROUTES.some((route) => original.url?.includes(route))) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      // 🔄 Pedir nuevo access token
      const { data } = await axios.post(
        `${API_URL}/auth/refresh`,
        {},
        {
          headers: {
            'x-refresh-token': refreshToken,
          },
        }
      );

      // 💾 Guardar nuevos tokens en zustand-persist (key 'shopper-auth')
      try {
        const raw = localStorage.getItem('shopper-auth');
        const parsed = raw ? JSON.parse(raw) : { state: {} };
        parsed.state.accessToken  = data.accessToken;
        parsed.state.refreshToken = data.refreshToken;
        localStorage.setItem('shopper-auth', JSON.stringify(parsed));
      } catch { /* si falla el parse, el store de zustand lo manejará */ }

      // Actualizar también la cookie del middleware
      document.cookie = `accessToken=${data.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

      // 🔁 Reintentar request original
      original.headers.Authorization = `Bearer ${data.accessToken}`;

      return api(original);

    } catch (err) {
      // 🚪 Logout automático limpio
      localStorage.removeItem('shopper-auth');
      document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax';

      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }

      return Promise.reject(err);
    }
  }
);

export default api;