// Service Worker für Wahrnehmungsschule
// Version hochzählen bei neuen Builds, damit der Cache aktualisiert wird
const CACHE_NAME = 'wahrnehmungsschule-v1';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './Wahrnehmungsschule_1.bin',
  './Wahrnehmungsschule_1.data',
];

// Installation: alle Dateien in den Cache laden
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('[SW] Cache wird befüllt...');
      // bin und data können groß sein – einzeln cachen damit ein Fehler nicht alles blockiert
      return cache.addAll(['./index.html', './manifest.json']).then(function() {
        return cache.add('./Wahrnehmungsschule_1.bin').catch(function(e) {
          console.warn('[SW] .bin konnte nicht gecacht werden:', e);
        });
      }).then(function() {
        return cache.add('./Wahrnehmungsschule_1.data').catch(function(e) {
          console.warn('[SW] .data konnte nicht gecacht werden:', e);
        });
      });
    })
  );
  self.skipWaiting();
});

// Aktivierung: alten Cache löschen
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          console.log('[SW] Alter Cache wird gelöscht:', name);
          return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Cache-first – aus Cache laden, bei Fehler Netzwerk
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) {
        return cached;
      }
      return fetch(event.request).then(function(response) {
        // Nur gültige Antworten cachen
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        var responseClone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseClone);
        });
        return response;
      });
    })
  );
});
