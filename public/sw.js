/* PrepLearn offline SW — split caches: pages (contentHash) + build assets (assetsHash) */

const PAGES_PREFIX = "preplearn-pages-";
const ASSETS_PREFIX = "preplearn-assets-";
const SHELL_URLS = [
  "/",
  "/templates",
  "/offline-fallback.html",
  "/offline-routes.json",
  "/manifest.json",
  "/sw.js",
  "/icons/icon.svg",
];

let activeContentHash = null;
let activeAssetsHash = null;

async function fetchManifest() {
  try {
    const res = await fetch("/offline-routes.json", { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function pagesCacheName(contentHash) {
  return `${PAGES_PREFIX}${contentHash}`;
}

function assetsCacheName(assetsHash) {
  return `${ASSETS_PREFIX}${assetsHash}`;
}

async function ensureVersions() {
  if (activeContentHash && activeAssetsHash) return;
  const manifest = await fetchManifest();
  if (manifest?.contentHash) activeContentHash = manifest.contentHash;
  if (manifest?.assetsHash) activeAssetsHash = manifest.assetsHash;
}

async function pruneOldCaches(contentHash, assetsHash) {
  const keys = await caches.keys();
  await Promise.all(
    keys.map((key) => {
      if (key.startsWith(PAGES_PREFIX) && key !== pagesCacheName(contentHash)) {
        return caches.delete(key);
      }
      if (key.startsWith(ASSETS_PREFIX) && key !== assetsCacheName(assetsHash)) {
        return caches.delete(key);
      }
      return Promise.resolve(false);
    }),
  );
}

function isRscRequest(request) {
  const url = new URL(request.url);
  return (
    request.headers.get("RSC") === "1" ||
    request.headers.get("Next-Router-Prefetch") === "1" ||
    url.searchParams.has("_rsc")
  );
}

function isDocumentRequest(request) {
  return (
    request.mode === "navigate" ||
    (request.headers.get("accept") || "").includes("text/html")
  );
}

async function matchInCache(cacheName, request) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;

  const url = new URL(request.url);
  const pathOnly = new Request(url.origin + url.pathname, { method: "GET" });
  const pathHit = await cache.match(pathOnly);
  if (pathHit) return pathHit;

  if (isDocumentRequest(request) || isRscRequest(request)) {
    return cache.match(url.pathname);
  }

  return undefined;
}

async function matchCaches(request) {
  await ensureVersions();

  if (activeContentHash) {
    const hit = await matchInCache(pagesCacheName(activeContentHash), request);
    if (hit) return hit;
  }

  if (activeAssetsHash) {
    const hit = await matchInCache(assetsCacheName(activeAssetsHash), request);
    if (hit) return hit;
  }

  return undefined;
}

async function putInCache(request, response, bucket) {
  await ensureVersions();
  if (!activeContentHash || !activeAssetsHash) return;

  const name =
    bucket === "pages"
      ? pagesCacheName(activeContentHash)
      : assetsCacheName(activeAssetsHash);
  const cache = await caches.open(name);
  await cache.put(request, response);
}

async function precacheShell(manifest) {
  if (!manifest?.contentHash || !manifest?.assetsHash) return;

  activeContentHash = manifest.contentHash;
  activeAssetsHash = manifest.assetsHash;

  const pages = await caches.open(pagesCacheName(activeContentHash));
  await Promise.all(
    SHELL_URLS.map(async (url) => {
      try {
        const existing = await pages.match(url);
        if (existing) return;
        const response = await fetch(url, { credentials: "same-origin" });
        if (response.ok) await pages.put(url, response);
      } catch {
        /* skip */
      }
    }),
  );
}

async function countCachedPages(contentHash) {
  if (!contentHash) return 0;
  const cache = await caches.open(pagesCacheName(contentHash));
  const keys = await cache.keys();
  return keys.length;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    fetchManifest()
      .then((manifest) => precacheShell(manifest))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const manifest = await fetchManifest();
      if (manifest?.contentHash) activeContentHash = manifest.contentHash;
      if (manifest?.assetsHash) activeAssetsHash = manifest.assetsHash;
      if (activeContentHash && activeAssetsHash) {
        await pruneOldCaches(activeContentHash, activeAssetsHash);
        await precacheShell(manifest);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === "SET_VERSIONS") {
    if (data.contentHash) activeContentHash = data.contentHash;
    if (data.assetsHash) activeAssetsHash = data.assetsHash;
    return;
  }

  if (data.type === "GET_CACHE_STATS") {
    const port = event.ports?.[0];
    const contentHash = data.contentHash || activeContentHash;
    event.waitUntil(
      (async () => {
        const pageCount = await countCachedPages(contentHash);
        port?.postMessage({ pageCount, contentHash });
      })(),
    );
    return;
  }

  if (data.type !== "PRECACHE_BATCH") return;

  const urls = data.urls || [];
  const bucket = data.bucket === "assets" ? "assets" : "pages";
  const port = event.ports?.[0];

  if (data.contentHash) activeContentHash = data.contentHash;
  if (data.assetsHash) activeAssetsHash = data.assetsHash;

  event.waitUntil(
    (async () => {
      await ensureVersions();
      const name =
        bucket === "assets"
          ? assetsCacheName(activeAssetsHash)
          : pagesCacheName(activeContentHash);
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

  // Never intercept Next.js dev HMR or turbopack sockets.
  if (
    url.pathname.includes("/_next/webpack-hmr") ||
    url.pathname.includes("/_next/turbopack-hmr") ||
    url.searchParams.has("__nextDevClientId")
  ) {
    return;
  }

  event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
  await ensureVersions();

  const cached = await matchCaches(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const bucket =
        request.url.includes("/_next/static/") ||
        request.url.includes("/icons/") ||
        request.url.endsWith("/manifest.json") ||
        request.url.endsWith("/sw.js")
          ? "assets"
          : "pages";
      await putInCache(request, response.clone(), bucket);
    }
    return response;
  } catch {
    if (isDocumentRequest(request)) {
      const fallback = await matchCaches(new Request("/offline-fallback.html"));
      if (fallback) return fallback;
    }

    if (isRscRequest(request)) {
      const url = new URL(request.url);
      const docRequest = new Request(url.origin + url.pathname, {
        method: "GET",
        headers: { accept: "text/html" },
      });
      const docCached = await matchCaches(docRequest);
      if (docCached) return docCached;
    }

    return new Response("Offline — content not cached yet.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
