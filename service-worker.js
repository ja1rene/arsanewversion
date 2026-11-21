/* ============================================
   ARSA — Service Worker
   Cache-first strategy for app shell assets,
   enabling full offline functionality, plus a
   best-effort periodic background sync handler
   for workout reminders (Chrome/Android only —
   see js/reminders.js for the full explanation
   of what this can and can't guarantee).
   ============================================ */

// Bump APP_VERSION every time you push changes to GitHub. That one edit is
// what tells installed copies of the app that an update exists.
const APP_VERSION = '1.13.1';
const CACHE_NAME = 'arsa-' + APP_VERSION;
// Bundled exercise animations (media/*.gif). Listed in js/media-map.js.
importScripts('./js/media-map.js');
// Separate cache for animations people save for offline use. It is NOT
// versioned, so app updates never delete it.
const MEDIA_CACHE = 'arsa-media';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/tokens.css',
  './css/session.css',
  './css/screens.css',
  './css/coach.css',
  './css/onboarding.css',
  './css/media.css',
  './fonts/archivo-latin-400-normal.woff2',
  './fonts/archivo-latin-500-normal.woff2',
  './fonts/archivo-latin-600-normal.woff2',
  './fonts/archivo-latin-700-normal.woff2',
  './fonts/martian-mono-latin-400-normal.woff2',
  './fonts/martian-mono-latin-500-normal.woff2',
  './fonts/martian-mono-latin-600-normal.woff2',
  './js/changelog.js',
  './js/coach-kb.js',
  './js/coach-kb-exercises.js',
  './js/coach-kb-training.js',
  './js/coach-kb-body.js',
  './js/coach-kb-nutrition.js',
  './js/coach-kb-gym.js',
  './js/coach.js',
  './js/coach-safety.js',
  './js/coach-engine.js',
  './js/media-map.js',
  './js/media.js',
  './js/onboarding.js',
  './js/splits.js',
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
      // cache: 'reload' skips the browser's own HTTP cache (GitHub Pages
      // caches files for ~10 minutes) so a new version really is the new files.
      .then((cache) =>
        cache.addAll(APP_SHELL.map((u) => new Request(u, { cache: 'reload' })))
          // Animations are optional: a missing file must never break the install.
          .then(() => Promise.all(Object.values(EXERCISE_MEDIA).map((u) =>
            cache.add(new Request('./' + u, { cache: 'reload' })).catch(() => {}))))
      )
  );
  // No skipWaiting here: the new version waits until the person taps
  // "Reload" in the app, so it never swaps files under a workout in progress.
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME && key !== MEDIA_CACHE).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Videos ask for byte ranges; answer them from the cache so MP4s play offline.
  if (event.request.headers.has('range')) {
    event.respondWith(rangeResponse(event.request));
    return;
  }

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

async function rangeResponse(req) {
  const cached = await caches.match(req.url);
  if (!cached || cached.type === 'opaque') return cached || fetch(req);
  const buf = await cached.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || '');
  let start = m && m[1] ? parseInt(m[1], 10) : 0;
  let end = m && m[2] ? parseInt(m[2], 10) : buf.byteLength - 1;
  end = Math.min(end, buf.byteLength - 1);
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': cached.headers.get('Content-Type') || 'video/mp4',
      'Content-Range': 'bytes ' + start + '-' + end + '/' + buf.byteLength,
      'Content-Length': String(end - start + 1)
    }
  });
}

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
