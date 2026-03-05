const cacheName = 'pru-app-cache-v8'; // Incrémenter ce numéro à chaque modification
const filesToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/PRU_logo_192.png',
  '/PRU_logo_512.png'
];

// Installation du service worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Installation...');
  event.waitUntil(
    caches.open(cacheName).then(cache => {
      console.log('[Service Worker] Mise en cache des fichiers');
      return cache.addAll(filesToCache);
    })
  );
  // Force le nouveau SW à devenir actif immédiatement
  self.skipWaiting();
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activation...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== cacheName) {
            console.log('[Service Worker] Suppression ancien cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      // Prend immédiatement le contrôle de toutes les pages
      return self.clients.claim();
    })
  );
});

// Stratégie Cache First pour une expérience offline optimale
// Network First pour les documents HTML (toujours la version à jour),
// Cache First pour les assets statiques (images, manifeste).
self.addEventListener('fetch', event => {
  const isDocument = event.request.destination === 'document' ||
    event.request.url.endsWith('/') ||
    event.request.url.endsWith('/index.html');

  if (isDocument) {
    // Network First : on tente le réseau, fallback sur le cache si hors ligne
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(cacheName).then(cache => cache.put(event.request, responseToCache));
        }
        return response;
      }).catch(() => {
        console.log('[Service Worker] Hors ligne, retour au cache pour:', event.request.url);
        return caches.match(event.request) || caches.match('/index.html');
      })
    );
  } else {
    // Cache First pour les assets statiques
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(cacheName).then(cache => cache.put(event.request, responseToCache));
          return response;
        });
      })
    );
  }
});

