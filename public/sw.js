/* PrepLearn offline service worker — versioned cache, bulk precache only on deploy */

const CACHE_PREFIX = "preplearn-";
let activeCacheName = `${CACHE_PREFIX}boot`;

async function fetchManifest() {
  const res = await fetch("/offline-routes.json", { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

async function resolveCacheName() {
  try {
    const manifest = await fetchManifest();
    if (manifest?.contentHash) {
      activeCacheName = `${CACHE_PREFIX}${manifest.contentHash}`;
    }
  } catch {
    /* keep current cache name */
  }
  return activeCacheName;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    resolveCacheName()
      .then((name) => caches.open(name))
      .then((cache) =>
        cache.addAll([
          "/offline-routes.json",
          "/offline-fallback.html",
          "/manifest.json",
        ]),
      )
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const name = await resolveCacheName();
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith(CACHE_PREFIX) && k !== name)
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === "SET_CONTENT_HASH" && data.contentHash) {
    activeCacheName = `${CACHE_PREFIX}${data.contentHash}`;
    return;
  }

  if (data.type !== "PRECACHE_BATCH") return;

  const urls = data.urls || [];
  const port = event.ports?.[0];

  event.waitUntil(
    (async () => {
      const name = data.contentHash
        ? `${CACHE_PREFIX}${data.contentHash}`
        : await resolveCacheName();
      activeCacheName = name;
      const cache = await caches.open(name);
      let cached = 0;

      await Promise.all(
        urls.map(async (url) => {
          try {
            const response = await fetch(url, { credentials: "same-origin" });
            if (response.ok) {
              await cache.put(url, response);
              cached++;
            }
          } catch {
            /* skip */
          }
        }),
      );

      port?.postMessage({ cached, total: urls.length });
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
  const cache = await caches.open(activeCacheName);
  const cached = await cache.match(request);

  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    if (isDocumentRequest(request)) {
      const fallback = await cache.match("/offline-fallback.html");
      if (fallback) return fallback;
    }
    return new Response("Offline — content not cached yet.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

function isDocumentRequest(request) {
  return (
    request.mode === "navigate" ||
    (request.headers.get("accept") || "").includes("text/html")
  );
}
