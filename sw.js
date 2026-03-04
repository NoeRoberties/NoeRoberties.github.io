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
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        console.log('[Service Worker] Réponse depuis le cache:', event.request.url);
        return cachedResponse;
      }
      
      // Si pas dans le cache, on récupère depuis le réseau
      return fetch(event.request).then(response => {
        // On ne met en cache que les requêtes GET valides
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Clone de la réponse pour la mettre en cache
        const responseToCache = response.clone();
        caches.open(cacheName).then(cache => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      }).catch(() => {
        // Si hors ligne et pas dans le cache, retourner la page principale
        console.log('[Service Worker] Hors ligne, retour à index.html');
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
