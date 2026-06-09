import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ── Salida standalone para Docker (server.js minimal) ───
  output: 'standalone',

  // ── Lint: no bloquear el build de producción por warnings de ESLint ──
  //    (el código se compila igual; TypeScript se sigue verificando aparte)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ── Imágenes permitidas ─────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com'     },
      { protocol: 'https', hostname: 'images.unsplash.com'    },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'platform-lookaside.fbsbx.com' },
      { protocol: 'https', hostname: '**.amazonaws.com'       },
      { protocol: 'https', hostname: 'picsum.photos'          },
      { protocol: 'https', hostname: 'fastly.picsum.photos'   },
      { protocol: 'http',  hostname: 'localhost'              },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 640, 768, 1024, 1280, 1536],
    minimumCacheTTL: 86400,
  },

  // ── Headers de seguridad HTTP ───────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevenir clickjacking
          { key: 'X-Frame-Options',           value: 'DENY' },
          // Prevenir MIME sniffing
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          // XSS protection
          { key: 'X-XSS-Protection',          value: '1; mode=block' },
          // Referrer policy
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          // Permissions policy
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=(self)' },
          // HSTS (solo en prod)
          ...(process.env.NODE_ENV === 'production'
            ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
            : []),
          // CSP básico
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http://localhost:*",
              "connect-src 'self' https: http://localhost:* wss: ws:",
              "frame-src 'self' https://accounts.google.com",
              "worker-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
      // Cache para el Service Worker
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control',             value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type',              value: 'application/javascript; charset=utf-8' },
          { key: 'Service-Worker-Allowed',    value: '/' },
        ],
      },
      // Cache para el manifest
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control',             value: 'public, max-age=86400' },
          { key: 'Content-Type',              value: 'application/manifest+json' },
        ],
      },
    ];
  },

  // ── Redirects ───────────────────────────────────────────
  async redirects() {
    return [
      // Redirigir /shop → /#tiendas
      { source: '/shop', destination: '/#tiendas', permanent: false },
      // Redirigir /tiendas → /#tiendas
      { source: '/tiendas', destination: '/#tiendas', permanent: false },
      // Redirigir /vender → /auth/register
      { source: '/vender', destination: '/auth/register', permanent: false },
    ];
  },

  // ── Performance ─────────────────────────────────────────
  compress:              true,
  poweredByHeader:       false,
  reactStrictMode:       true,
  experimental: {
    optimizePackageImports: ['framer-motion', 'recharts', 'lucide-react'],
  },
};

export default nextConfig;
