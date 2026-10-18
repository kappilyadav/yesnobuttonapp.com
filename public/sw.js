// Minimal service worker: makes the app installable and lets the button work offline.
// Bump VERSION to invalidate old caches on deploy.
const VERSION = 'ynb-v3';
const PRECACHE = ['/', '/spinner-wheel-tick.mp3', '/favicon.svg', '/icon-any-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  // Only handle same-origin GETs. Ads, analytics and other third parties pass through untouched.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // Pages: network first so content stays fresh, cached copy when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match('/')))
    );
    return;
  }

  // Static files (hashed assets, images, audio): cache first, fill on miss.
  if (/^\/(_assets|images)\//.test(url.pathname) || /\.(mp3|svg|png|webp|woff2?)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then((hit) => {
        if (hit) return hit;
        return fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        });
      })
    );
  }
});
