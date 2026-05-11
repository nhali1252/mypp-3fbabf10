/**
 * Minimal service worker — exists ONLY to make the site installable
 * (Chrome's "Install app" 3-dot menu requires a registered SW with a
 * fetch handler). Intentionally does NOT cache anything: every request
 * goes straight to the network so deploys are never shadowed by a
 * stale shell.
 */
self.addEventListener("install", (event) => {
  // Activate immediately on first install.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Nuke any caches an older version of this SW may have created.
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

// Pass-through fetch handler. Required for installability — without an
// onfetch listener Chrome will not show "Install app".
self.addEventListener("fetch", (event) => {
  // Let the browser handle it normally. No respondWith → no caching.
});
