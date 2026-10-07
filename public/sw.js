const CACHE_NAME = 'usas-class-timetable-v2';
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/404.html',
  '/500.html',
  '/502.html',
  '/503.html',
  '/504.html',
  '/error.css',
  '/error-page.js',
  '/usas-logo.png',
  '/usas-logo-dark.png',
  '/usas-logo-light.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return undefined;
        })
      )
    )
  );
  self.clients.claim();
});

async function serveOfflineFallback(_request) {
  const cache = await caches.open(CACHE_NAME);
  const offline = await cache.match('/offline.html');
  if (offline) return offline;
  return new Response('Offline', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } });
}

function shouldCacheRequest(pathname, destination) {
  if (pathname.startsWith('/api/')) return false;
  if (
    pathname === '/' ||
    pathname === '/index.html' ||
    pathname === '/offline.html' ||
    pathname === '/404.html' ||
    pathname === '/500.html' ||
    pathname === '/502.html' ||
    pathname === '/503.html' ||
    pathname === '/504.html' ||
    pathname === '/error.css' ||
    pathname === '/error-page.js' ||
    pathname === '/usas-logo.png' ||
    pathname === '/usas-logo-dark.png' ||
    pathname === '/usas-logo-light.png'
  ) {
    return true;
  }

  return destination === 'script' || destination === 'style' || destination === 'image' || destination === 'font';
}

function shouldUseNetworkFirst(mode, pathname) {
  return mode === 'navigate' && !pathname.startsWith('/api/');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (shouldUseNetworkFirst(request.mode, url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const responseCopy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy)).catch(() => {});
          }
          return response;
        })
        .catch(() => serveOfflineFallback(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.ok && shouldCacheRequest(url.pathname, request.destination)) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone())).catch(() => {});
          }
          return response;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkFetch;
    })
  );
});
