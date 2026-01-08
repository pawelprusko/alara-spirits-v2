// SERVICE WORKER DISABLED FOR STABILITY IN PREVIEW
// To avoid caching issues and CORS errors during development/preview.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Immediately claim clients to ensure updates happen
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass all requests directly to network
  event.respondWith(fetch(event.request));
});