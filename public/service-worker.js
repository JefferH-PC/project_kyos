/* eslint-disable no-restricted-globals */

// Kyos PWA Service Worker
const CACHE_NAME = 'kyos-cache-v2';
const DATA_CACHE_NAME = 'kyos-data-cache-v2';

const STATIC_PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './favicon.ico',
  './money-logo.svg',
  './logo192.png',
  './logo512.png',
  './robots.txt'
];

// Install Event - Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE_URLS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate Event - Clean up stale caches and claim clients
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, DATA_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch Event - Handle network requests with offline fallbacks
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle HTTP/HTTPS GET requests
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  const url = new URL(request.url);

  // 1. External API requests (e.g. brasilapi holidays, CDI rate)
  // Network-first with cache fallback
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(DATA_CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          return new Response(JSON.stringify({ error: 'offline' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 503
          });
        })
    );
    return;
  }

  // 2. Navigation requests (HTML page loads)
  // Network-first, fallback to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          return (await caches.match('./index.html')) || (await caches.match('./'));
        })
    );
    return;
  }

  // 3. Static assets (JS, CSS, images, fonts)
  // Cache-first with background network revalidation (Stale-While-Revalidate)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed, nothing to do since cachedResponse may be served
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Listen for message from client to activate immediately
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
