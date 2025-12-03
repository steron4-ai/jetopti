// public/service-worker-improved.js
// Network-First Strategie: Verhindert White Screen durch veraltete Caches

const CACHE_NAME = 'jetopti-v2';
const CACHE_VERSION = 2; // Erhöhe bei jedem Deploy!

// Assets die gecacht werden sollen
const urlsToCache = [
  '/',
  '/map',
  '/dashboard',
  '/images/logo.png',
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching assets');
        return cache.addAll(urlsToCache);
      })
  );
  // Force activation
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Lösche alte Caches
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control immediately
  self.clients.claim();
});

// Fetch: NETWORK FIRST (verhindert White Screen!)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    // Versuche zuerst das Netzwerk
    fetch(event.request)
      .then((response) => {
        // Wenn erfolgreich, clone und cache
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Nur bei Netzwerk-Fehler: Fallback auf Cache
        return caches.match(event.request).then((response) => {
          if (response) {
            console.log('[SW] Serving from cache:', event.request.url);
            return response;
          }
          // Wenn auch nicht im Cache: Fehler
          return new Response('Offline - keine Verbindung möglich', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        });
      })
  );
});

// Handle messages from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] SKIP_WAITING received');
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker loaded - Network First Strategy');
