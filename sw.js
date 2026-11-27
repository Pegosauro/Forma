const CACHE_PREFIX = 'forma-pwa-' + self.registration.scope + '-';
const CACHE_NAME = CACHE_PREFIX + '141f7c163fe808';
const ASSETS = ['./index.html', './manifest.webmanifest', './icons/forma-192.png', './icons/forma-512.png'];
const absolute = path => new URL(path, self.registration.scope).href;
const entry = absolute('./index.html');
const assets = new Set(ASSETS.map(absolute));

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll([...assets].map(url => new Request(url, {cache:'reload'})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const {request} = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  url.search = '';
  if (request.mode === 'navigate' && (url.href === self.registration.scope || url.href === entry)) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) return response;
        return await (await caches.open(CACHE_NAME)).match(entry) || response;
      } catch {
        return await (await caches.open(CACHE_NAME)).match(entry) || Response.error();
      }
    })());
  } else if (assets.has(url.href)) {
    event.respondWith((async () => {
      return await (await caches.open(CACHE_NAME)).match(url.href) || await fetch(request);
    })());
  }
});
