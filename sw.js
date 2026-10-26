// Service Worker para cache inteligente (v2 - Network-first para HTML / Cache-first para assets)
const CACHE_NAME = 'matematica-findoff-v2';

const STATIC_ASSETS_TO_CACHE = [
  '/public/assets/optimized/hero_mobile.webp',
  '/public/assets/optimized/hero_desktop.webp',
  '/public/assets/optimized/cover_vol1.webp',
  '/public/assets/optimized/cover_vol2.webp',
  '/public/assets/optimized/cover_vol3.webp',
  '/public/assets/optimized/author.webp'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Apagando cache antigo:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Não intercetar requisições para a API (/api/*)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  const isHtmlRequest =
    event.request.mode === 'navigate' ||
    event.request.destination === 'document' ||
    url.pathname === '/' ||
    url.pathname.endsWith('.html') ||
    (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'));

  // 1. ESTRATÉGIA NETWORK-FIRST PARA HTML (garante que alterações e saída de manutenção entram na hora)
  if (isHtmlRequest) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const resClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, resClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            return cached || caches.match('/') || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // 2. ESTRATÉGIA CACHE-FIRST PARA IMAGENS, FONTES, CSS E JS ESTÁTICOS
  const isStaticAsset =
    url.pathname.match(/\.(webp|png|jpg|jpeg|svg|woff2|woff|ttf|css|js)$/i) ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('fonts.googleapis.com');

  if (isStaticAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => cachedResponse);
        });
      })
    );
    return;
  }

  // Padrão: Network-first
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
