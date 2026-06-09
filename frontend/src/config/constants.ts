// ── Negocio ───────────────────────────────────────────────────────────
export const IVA_RATE = 0.19;
export const FREE_SHIPPING_THRESHOLD = 150_000; // COP

// ── Auth / cookies ────────────────────────────────────────────────────
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 días en segundos
// En producción la app corre sobre HTTPS, así que añadimos Secure.
// En desarrollo (http://localhost) NO se agrega o el navegador rechazaría la cookie.
const COOKIE_SECURE = process.env.NODE_ENV === 'production' ? '; Secure' : '';
export const COOKIE_CONFIG  = `path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax${COOKIE_SECURE}`;

// ── API ───────────────────────────────────────────────────────────────
export const API_ENDPOINTS = {
  refresh: '/auth/refresh',
  logout:  '/auth/logout',
  chat:    '/chat',
} as const;

// ── Rutas públicas (no requieren auth) ───────────────────────────────
export const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/verify',
  '/auth/callback',
  '/store',
  '/search',
  '/terms',
  '/privacy',
  '/offline.html',
] as const;

// ── Site ──────────────────────────────────────────────────────────────
export const SITE_CONFIG = {
  name:     'Shopper',
  tagline:  'Marketplace Colombiano',
  email:    'soporte@shopper.co',
  location: 'Bogotá D.C., Colombia',
  url:      process.env.NEXT_PUBLIC_SITE_URL ?? 'https://shopper.co',
  phone:    '+57 1 234 5678',
} as const;

// ── Animaciones ───────────────────────────────────────────────────────
export const ANIMATION_DURATION_MS = 1800;
export const TARGET_FPS            = 60;
