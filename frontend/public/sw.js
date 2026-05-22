// ═══════════════════════════════════════════════════════════════════
// Shopper — Service Worker PWA
// Estrategia: Cache-first para assets, Network-first para API
// ═══════════════════════════════════════════════════════════════════

const CACHE_VERSION   = 'shopper-v1';
const STATIC_CACHE    = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE   = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE     = `${CACHE_VERSION}-images`;

// Assets estáticos para precargar en install
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
];

// ── Install ────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {/* silenciar si offline */});
    }).then(() => self.skipWaiting())
  );
});

// ── Activate ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('shopper-') && key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== IMAGE_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ──────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // No cachear: requests de API, auth, extensiones del navegador
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('localhost') && url.port === '3001' ||
    request.url.includes('/auth/') ||
    request.method !== 'GET'
  ) {
    return;
  }

  // Imágenes: Cache-first con fallback
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch {
          return new Response('', { status: 408 });
        }
      })
    );
    return;
  }

  // Páginas/assets Next.js: Network-first con fallback a cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          // Fallback offline para navegación
          if (request.destination === 'document') {
            return caches.match('/offline.html');
          }
          return new Response('', { status: 408 });
        })
      )
  );
});

// ── Push Notifications ─────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'Shopper', {
      body:    data.body  || 'Tienes una nueva notificación',
      icon:    '/icons/icon-192.png',
      badge:   '/icons/icon-72.png',
      tag:     data.tag   || 'shopper-notification',
      data:    { url: data.url || '/' },
      actions: [{ action: 'open', title: 'Ver' }],
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const existing = clientList.find((c) => c.url === url && 'focus' in c);
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});
