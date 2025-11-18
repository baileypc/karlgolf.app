// Karl's GIR - Service Worker
// This enables offline functionality and PWA installation

const CACHE_NAME = 'karls-gir-v3.2.0';
const RUNTIME_CACHE = 'karls-gir-runtime';

// Assets to cache on install (only files, not directories)
const ASSETS_TO_CACHE = [
  '/index.html',
  '/manifest.json',
  '/images/karls_gir.png',
];

// Install event - cache initial assets
self.addEventListener('install', (event) => {
  console.log('✅ Service Worker: Installing...');
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ Service Worker: Caching initial assets');
        // Cache each asset individually to avoid failing all if one fails
        return Promise.allSettled(
          ASSETS_TO_CACHE.map(url => 
            cache.add(new Request(url, { cache: 'reload' }))
              .catch(err => {
                console.warn(`⚠️ Service Worker: Failed to cache ${url}`, err);
                return null; // Continue even if one fails
              })
          )
        );
      })
      .catch((error) => {
        console.error('❌ Service Worker: Cache failed', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete any cache that doesn't match current version
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('🗑️ Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API calls (always fetch from network)
  if (url.pathname.includes('/api/')) {
    return;
  }

  // Network-first strategy for HTML (always get fresh content)
  if (request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response before caching
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(request).then((response) => {
            return response || caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // Cache-first strategy for assets (CSS, JS, images, fonts)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(request)
        .then((response) => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Clone the response before caching
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });

          return response;
        })
        .catch((error) => {
          console.error('❌ Service Worker: Fetch failed', error);
          // Return offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
        });
    })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
