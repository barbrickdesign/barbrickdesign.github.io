// Enhanced Service Worker with better caching and offline support
const CACHE_NAME = 'barbrick-v2';
const OFFLINE_PAGE = '/offline.html';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/wallet-button.css',
  '/universal-wallet-auth.js',
  '/auth-integration.js',
  '/wallet-button.js',
  '/auth-bootstrap.js',
  '/fpds-contract-schema.js',
  '/samgov-integration.js',
  '/samgov-api-integration.js',
  '/agent-types.js',
  '/monitoring-systems.js',
  '/agent-core.js',
  '/agent-system.js',
  '/agent-display.js'
];

// Install event - cache all static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch event with network-first strategy
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache the response for future use
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });
        return response;
      })
      .catch(() => {
        // If network fails, try to get from cache
        return caches.match(event.request)
          .then((response) => {
            // Return offline page if no cache match
            return response || caches.match(OFFLINE_PAGE);
          });
      })
  );
});

// Background sync for offline data sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Implement your background sync logic here
  console.log('Background sync in progress...');
  // Add your sync logic here
}
