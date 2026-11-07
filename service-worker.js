/* ============================================
   ARSA — Service Worker
   Cache-first strategy for app shell assets,
   enabling full offline functionality, plus a
   best-effort periodic background sync handler
   for workout reminders (Chrome/Android only —
   see js/reminders.js for the full explanation
   of what this can and can't guarantee).
   ============================================ */

const CACHE_NAME = 'arsa-cache-v7';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/tokens.css',
  './css/session.css',
  './css/screens.css',
  './fonts/archivo-latin-400-normal.woff2',
  './fonts/archivo-latin-500-normal.woff2',
  './fonts/archivo-latin-600-normal.woff2',
  './fonts/archivo-latin-700-normal.woff2',
  './fonts/martian-mono-latin-400-normal.woff2',
  './fonts/martian-mono-latin-500-normal.woff2',
  './fonts/martian-mono-latin-600-normal.woff2',
  './js/streak-engine.js',
  './js/data.js',
  './js/exercises-db.js',
  './js/reminders.js',
  './js/dashboard.js',
  './js/workouts.js',
  './js/library.js',
  './js/plate-calc.js',
  './js/session.js',
  './js/progress.js',
  './js/settings.js',
  './js/app.js',
  './icons/favicon.svg',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then((networkResponse) => {
          // Cache successful same-origin responses for future offline use
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            event.request.url.startsWith(self.location.origin)
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback: serve the app shell for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});

// Best-effort background reminder check. Only fires on browsers that
// support the Periodic Background Sync API (Chrome/Android, installed
// PWAs only) and only as often as the OS decides to allow — there is no
// guarantee this runs on any particular schedule, or at all, especially
// on battery-saver mode or low-data conditions. This is a bonus path on
// top of the foreground check in js/reminders.js, not a replacement for
// opening the app. The service worker has no access to a DOM, so it
// can't run the full Store/Reminders logic directly — instead it just
// fires a generic nudge notification, and the real, accurate check still
// happens the next time the person actually opens Arsa.
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'arsa-reminder-check') {
    event.waitUntil(
      self.registration.showNotification('Arsa', {
        body: "Don't forget to check in on your training today.",
        icon: './icons/icon-192.png',
        badge: './icons/icon-192.png',
        tag: 'arsa-daily-reminder'
      })
    );
  }
});
