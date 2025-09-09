// Service Worker for KSCB - Offline support and caching
const CACHE_NAME = 'kscb-v1.0.0';
const urlsToCache = [
  'index.html',
  'assets/css/styles.css',
  'assets/js/main.js',
  'assets/js/security.js',
  'assets/js/cms.config.js',
  'assets/js/lazy-load.js',
  'assets/img/logo.png',
  'assets/data/deposits.json',
  'assets/data/loans.json',
  'assets/data/activities.json',
  'assets/data/notices.json',
  'assets/data/gallery.json',
  'assets/data/site.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Cache installation failed:', err);
      })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Network-first strategy for API calls
  if (url.pathname.startsWith('/api/') || url.hostname.includes('sanity')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Clone the response before caching
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(request, responseToCache);
            });
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Cache-first strategy for assets
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          // Update cache in background
          fetch(request)
            .then(fetchResponse => {
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(request, fetchResponse);
                });
            })
            .catch(() => {});
          return response;
        }

        // No cache match, fetch from network
        return fetch(request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(request, responseToCache);
              });

            return response;
          });
      })
      .catch(() => {
        // Offline fallback page
        if (request.destination === 'document') {
          return caches.match('offline.html');
      }
    })
  );
});

// Background sync for form submissions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-enquiries') {
    event.waitUntil(syncEnquiries());
  }
});

async function syncEnquiries() {
  try {
    const cache = await caches.open('enquiries');
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await fetch(request);
      if (response.ok) {
        await cache.delete(request);
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Push notification support
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New update from KSCB',
    icon: 'assets/img/logo.png',
    badge: 'assets/img/logo.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('KSCB Banking', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('./')
  );
});
