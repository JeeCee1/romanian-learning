// Romanian Learning App — Service Worker
// Bump CACHE_VERSION on every release to trigger update notification
const CACHE_VERSION = 'ro-learn-v5.26';
const ASSETS = ['/', '/index.html'];

// Allow page to trigger activation immediately
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// Install: cache assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(ASSETS))
  );
  // Activate immediately without waiting for old SW to finish
  self.skipWaiting();
});

// Activate: delete old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for index.html (so we always get the latest),
// cache-first for everything else
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isPage = url.pathname === '/' || url.pathname.endsWith('index.html');

  if (isPage) {
    // Network first with no-store to bypass iOS HTTP cache
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).then(res => {
        const clone = res.clone();
        caches.open(CACHE_VERSION).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
  } else {
    // Cache first
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
  }
});
