// Service Worker para Fichaje Pro (Google Play Store & PWA Compliant)
const CACHE_NAME = 'fichaje-pro-v18.21';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/icon.svg',
  '/favicon.ico',
  '/apple-touch-icon.png'
];

// Instalación: Precaching de recursos básicos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Fallo precaching parcial:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activación: Limpieza de versiones obsoletas de caché
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercepción de peticiones de red
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Ignorar peticiones no HTTP/HTTPS o de orígenes externos ajenos a APIs esenciales
  if (!url.protocol.startsWith('http')) return;

  // Para peticiones de navegación (HTML): Network first con fallback a caché
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const copy = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return networkRes;
        })
        .catch(() => caches.match('/') || caches.match('/index.html'))
    );
    return;
  }

  // Para imágenes y recursos estáticos: Cache first con fallback a red
  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|ico|css|js|woff|woff2)$/i) ||
    url.pathname.includes('/assets/')
  ) {
    event.respondWith(
      caches.match(req).then((cachedRes) => {
        if (cachedRes) return cachedRes;
        return fetch(req).then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const copy = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return networkRes;
        }).catch(() => null);
      })
    );
    return;
  }

  // Comportamiento por defecto
  event.respondWith(
    caches.match(req).then((cachedRes) => cachedRes || fetch(req))
  );
});
