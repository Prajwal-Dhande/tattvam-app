const CACHE_NAME = 'tattvam-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './logo.png'
];

// 1. Install Event: Caches the app shell (HTML, Icon, Manifest)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Fetch Event: Serves files from Cache if offline, otherwise gets from Network
self.addEventListener('fetch', (event) => {
  // We ignore API calls (backend) from caching so data is always fresh
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // If found in cache, return it
      if (response) {
        return response;
      }
      // Otherwise, fetch from network
      return fetch(event.request);
    })
  );
});

// 3. Activate Event: Cleans up old caches when you update the app
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});