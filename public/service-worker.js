// public/service-worker.js
// KILL SWITCH: Löscht alle Caches und deregistriert sich selbst

self.addEventListener('install', (event) => {
  console.log('🔥 [SW KILL] Installing...');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('🔥 [SW KILL] Activating - Destroying all caches...');
  
  event.waitUntil(
    // Delete all caches
    caches.keys()
      .then((cacheNames) => {
        console.log('🗑️ [SW KILL] Found caches:', cacheNames);
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('🗑️ [SW KILL] Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
      .then(() => {
        console.log('✅ [SW KILL] All caches deleted!');
        console.log('🔥 [SW KILL] Unregistering service worker...');
        
        // Unregister this service worker
        return self.registration.unregister();
      })
      .then((success) => {
        if (success) {
          console.log('✅ [SW KILL] Service Worker unregistered successfully!');
        } else {
          console.log('⚠️ [SW KILL] Service Worker unregistration failed');
        }
        
        // Reload all clients
        return self.clients.matchAll();
      })
      .then((clients) => {
        console.log('🔄 [SW KILL] Reloading all clients...');
        clients.forEach(client => {
          console.log('🔄 [SW KILL] Reloading:', client.url);
          client.navigate(client.url);
        });
      })
      .catch((error) => {
        console.error('❌ [SW KILL] Error:', error);
      })
  );
  
  // Take control of all clients immediately
  self.clients.claim();
});

// Don't cache anything - just pass through
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

console.log('🔥 [SW KILL SWITCH] Loaded - Will self-destruct on activation');
