/* CFS Sales Academy — offline shell. Cache version is the content hash, so a
   redeploy replaces the cached app instead of serving a stale one forever. */
const C = 'cfsway-8839725faff7';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(C).then(c => c.addAll(FILES).catch(() => {})));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(
    ks.filter(k => k !== C).map(k => caches.delete(k))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Only the app shell is ours to cache. Voice practice pulls the ElevenLabs widget and
  // its audio from other origins: caching those would serve a stale widget, and the
  // index.html fallback below would hand a failed script request the whole app as its
  // body. Let anything cross-origin go straight to the network.
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(C).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
