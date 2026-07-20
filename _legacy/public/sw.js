const CACHE_VERSION = "tempo-pelotas-v2";
const APP_SHELL_CACHE = `${CACHE_VERSION}-app-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const APP_SHELL_URLS = [
  "/",
  "/offline",
  "/manifest.webmanifest",
  "/icon.svg",
  "/pwa-icons/192",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then(async (cache) => {
        await Promise.allSettled(
          APP_SHELL_URLS.map(async (url) => {
            const response = await fetch(url, { cache: "reload" });
            if (response.ok) await cache.put(url, response);
          }),
        );
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== APP_SHELL_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);

    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone());
    }

    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || (await caches.match("/offline")) || Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) void cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  if (cached) {
    void networkPromise;
    return cached;
  }

  return (await networkPromise) || Response.error();
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/pwa-icons/") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".woff2");

  if (isStaticAsset) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "TEMPO Pelotas";
  const options = {
    body: data.body || "Há uma nova informação para Pelotas.",
    icon: data.icon || "/pwa-icons/192",
    badge: data.badge || "/pwa-icons/192",
    tag: data.tag || "tempo-pelotas",
    renotify: Boolean(data.renotify),
    requireInteraction: Boolean(data.requireInteraction),
    silent: Boolean(data.silent),
    vibrate: [160, 70, 160],
    data: {
      url: data.url || "/",
      receivedAt: Date.now(),
    },
    actions: Array.isArray(data.actions) ? data.actions.slice(0, 2) : [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destination = new URL(
    event.notification.data?.url || "/",
    self.location.origin,
  ).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (clientsList) => {
        for (const client of clientsList) {
          if (client.url === destination && "focus" in client) {
            return client.focus();
          }
        }

        const sameOriginClient = clientsList.find((client) =>
          client.url.startsWith(self.location.origin),
        );

        if (sameOriginClient && "navigate" in sameOriginClient) {
          await sameOriginClient.navigate(destination);
          return sameOriginClient.focus();
        }

        return self.clients.openWindow(destination);
      }),
  );
});
