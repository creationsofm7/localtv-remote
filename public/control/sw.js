/* ═══════════════════════════════════════════════════════════════
   LocalTV Remote — Service Worker
   Cache-first for static assets, network-only for WS & API.
   Bump CACHE_VERSION to invalidate all cached assets.
   ═══════════════════════════════════════════════════════════════ */

const CACHE_VERSION = 'localtv-remote-v2';

/**
 * Static assets to pre-cache on install.
 * These are the core files needed for the remote to render.
 */
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/controller.css',
  '/controller.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
];

/* ── Install: pre-cache core assets ── */

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Activate immediately without waiting for existing clients to close
  self.skipWaiting();
});

/* ── Activate: purge old caches ── */

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});

/* ── Fetch: cache-first for static, network-only for API/WS ── */

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (POST /api/switch-mode, etc.)
  if (request.method !== 'GET') return;

  // Skip WebSocket upgrade requests
  if (url.pathname === '/ws') return;

  // Skip the health endpoint — always live
  if (url.pathname === '/health') return;

  // Skip cross-origin requests (Google Fonts, etc.) — let them go to network
  if (url.origin !== self.location.origin) return;

  // Cache-first strategy for same-origin static assets
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // Return cached version immediately, but also update the cache in the background
        const networkFetch = fetch(request)
          .then((response) => {
            if (response && response.ok) {
              const clone = response.clone();
              caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => {
            // Network failed — that's fine, we have the cached version
          });

        // Fire-and-forget the background update
        void networkFetch;

        return cached;
      }

      // Not in cache — fetch from network and cache for next time
      return fetch(request).then((response) => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
