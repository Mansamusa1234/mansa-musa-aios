const CACHE_VERSION = "v2-mmm";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;

// Next.js content-hashed static assets — safe to cache permanently
const STATIC_PATTERN = /^\/_next\/static\//;

// API routes — always network, never intercept
const API_PATTERN = /^\/api\//;

// ── Lifecycle ────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Delete stale caches from previous versions
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
            .map((k) => caches.delete(k))
        )
      ),
    ])
  );
});

// ── Fetch strategy ───────────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Skip API routes entirely — let network handle them
  if (API_PATTERN.test(url.pathname)) return;

  // Cache-first for Next.js static assets (they have content-hash in filename)
  if (STATIC_PATTERN.test(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Network-first with offline fallback for HTML navigation
  if (request.mode === "navigate") {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }
});

// ── Strategies ───────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirstWithFallback(request) {
  const cache = await caches.open(DYNAMIC_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    return new Response(
      `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Offline — MansaMusaAI</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,sans-serif;background:#070712;color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:24px}
.icon{font-size:64px;margin-bottom:24px}
h1{font-size:28px;font-weight:800;margin-bottom:8px}
p{color:#6b7280;font-size:16px;max-width:380px;line-height:1.6;margin-top:8px}
button{margin-top:28px;padding:14px 28px;background:#6366f1;color:white;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer}
button:hover{background:#4f46e5}
</style>
</head>
<body>
<div class="icon">📡</div>
<h1>You're offline</h1>
<p>MansaMusaAI needs an internet connection to run AI workflows.</p>
<p>Connect to the internet and try again.</p>
<button onclick="window.location.reload()">Try again</button>
</body>
</html>`,
      {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }
}

// ── Push notifications ───────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  let data = { title: "MansaMusaAI", body: "You have a new notification." };
  try {
    if (event.data) data = event.data.json();
  } catch {
    // non-JSON payload — use defaults
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon",
      badge: "/icon",
      data: { url: data.url || "/dashboard" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
