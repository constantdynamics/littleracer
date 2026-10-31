// Offline-cache: de app werkt ook zonder internet (behalve spraakherkenning).
// Strategie: meteen uit de cache tonen en op de achtergrond verversen.
const VERSION = 'littleracer-v1';

const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'js/main.js',
  'js/env.js',
  'js/geometry.js',
  'js/logic.js',
  'js/match.js',
  'js/nav.js',
  'js/photos.js',
  'js/sound.js',
  'js/speech.js',
  'js/store.js',
  'js/tasks.js',
  'js/ui.js',
  'js/viz.js',
  'js/views/home.js',
  'js/views/parent.js',
  'js/views/race.js',
  'js/views/stickers.js',
  'fonts/fredoka-latin.woff2',
  'fonts/fredoka-latin-ext.woff2',
  'fonts/nunito-latin.woff2',
  'fonts/nunito-latin-ext.woff2',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const cached = await cache.match(request, { ignoreSearch: true });
      const fresh = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => null);
      if (cached) {
        event.waitUntil(fresh);
        return cached;
      }
      const response = await fresh;
      if (response) return response;
      if (request.mode === 'navigate') return (await cache.match('index.html')) || Response.error();
      return Response.error();
    }),
  );
});
