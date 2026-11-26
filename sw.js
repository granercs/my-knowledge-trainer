const CACHE = 'mkt-offline-v5';
const ROOT = new URL('./', self.location.href).href;
const ASSETS = ['index.html','icon-192.png','icon-512.png','manifest.webmanifest'].map(p => new URL(p, ROOT).href);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(url => new Request(url, {cache:'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('mkt-offline-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith(ROOT)) return;
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).then(async response => {
      if (!response.ok) throw new Error('Navigation failed');
      const cache = await caches.open(CACHE);
      await cache.put(ASSETS[0], response.clone());
      return response;
    }).catch(() => caches.match(ASSETS[0])));
  } else if (ASSETS.includes(req.url)) {
    event.respondWith(caches.match(req).then(hit => hit || fetch(req)));
  }
});
