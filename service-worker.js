// English Phrasebook — Service Worker
// Кешує файли додатку для роботи без інтернету

const CACHE_NAME = 'rozmovnyk-v1';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// Встановлення — кладемо файли в кеш
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Активація — прибираємо старі кеші
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Запит — спочатку дивимося в кеш, потім мережа
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        // Кешуємо тільки успішні відповіді з нашого домену
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Якщо немає мережі і немає в кеші — повертаємо головну
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
