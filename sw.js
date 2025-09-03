const CACHE_NAME = 'lexora-shell-v1';
const ASSETS_TO_CACHE = [
  '.',
  '/index.html',
  '/reader.html',
  '/reader.js',
  '/no-cover.png',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Network-first for navigation and dynamic resources; fallback to cache when offline.
self.addEventListener('fetch', event => {
  const req = event.request;

  // Ignore non-GET requests and browser-extension or data: requests
  if (req.method !== 'GET' || req.url.startsWith('chrome-extension:') || req.url.startsWith('mailto:')) {
    return;
  }

  // Allow requests to local blobs and data to pass through
  if (req.url.startsWith('blob:') || req.url.startsWith('data:')) return;

  // For same-origin navigations (HTML), try network then cache
  if (req.mode === 'navigate' || (req.destination === 'document')) {
    event.respondWith(
      fetch(req).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // For other same-origin requests, try network then cache; keep cache as fallback
  event.respondWith(
    fetch(req).then(res => {
      // Optionally cache static GET responses for future offline use
      if (res && res.ok && req.url.startsWith(self.location.origin)) {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req))
  );
});
