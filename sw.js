// ================================================================
//  NUMÉRO DE VERSION — À MODIFIER À CHAQUE MISE À JOUR DU SITE
//  Exemple : '10.0' devient '10.1'. Ce changement déclenche, chez
//  les utilisateurs, le message « ICI CHARTRES évolue ! » (une seule
//  fois par version). C'est le seul endroit à modifier.
// ================================================================
const APP_VERSION = '10.0';

const CACHE_NAME = 'ici-chartres-shell-v' + APP_VERSION;
const APP_SHELL = [
  './',
  './index.html',
  './app.html',
  './manifest.webmanifest',
  './icons/icon-192.png?v=2',
  './icons/icon-512.png?v=2',
  './icons/icon-maskable-512.png?v=2',
  './images/cathedrale-chartres.jpg',
  './images/logo-ici-pin.png'
];

self.addEventListener('install', (event) => {
  // S'il existe déjà une version active, il s'agit d'une MISE À JOUR (et non d'une première installation).
  const isUpdate = !!self.registration.active;
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      // Mise à jour : prévient les pages ouvertes qu'une nouvelle version vient d'être installée.
      // Première installation : aucun message.
      .then(() => (isUpdate ? self.clients.matchAll({ type: 'window', includeUncontrolled: true }) : []))
      .then((clients) => clients.forEach((client) => client.postMessage({ type: 'ICI_UPDATE_AVAILABLE', version: APP_VERSION })))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(request).then((response) => {
      if (response && response.status === 200) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    }).catch(() => caches.match(request).then((cached) => cached || (request.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
