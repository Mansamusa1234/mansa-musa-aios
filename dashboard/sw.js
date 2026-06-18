// Minimal service worker — caches the app shell so the dashboard opens instantly
// and still loads when the connection is flaky. Live data always comes from the API.
const CACHE = "mansamusa-os-v1";
const SHELL = ["./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = e.request.url;
  // Never cache API calls — always hit the network for live data.
  if (url.includes("/analytics/") || url.includes("/slots/") || url.includes("/tasks") ||
      url.includes("/status") || url.includes("/health")) {
    return; // default network behaviour
  }
  // App shell: cache-first.
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
