/* PrepLearn offline SW — split caches: pages (contentHash) + build assets (assetsHash) */

const PAGES_PREFIX = "preplearn-pages-";
const ASSETS_PREFIX = "preplearn-assets-";

let activeContentHash = null;
let activeAssetsHash = null;

async function fetchManifest() {
  const res = await fetch("/offline-routes.json", { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

function pagesCacheName(contentHash) {
  return `${PAGES_PREFIX}${contentHash}`;
}

function assetsCacheName(assetsHash) {
  return `${ASSETS_PREFIX}${assetsHash}`;
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

async function matchCaches(request) {
  if (activeContentHash) {
    const pages = await caches.open(pagesCacheName(activeContentHash));
    const hit = await pages.match(request);
    if (hit) return hit;
  }
  if (activeAssetsHash) {
    const assets = await caches.open(assetsCacheName(activeAssetsHash));
    const hit = await assets.match(request);
    if (hit) return hit;
  }
  return undefined;
}

async function putInCache(request, response, bucket) {
  const name =
    bucket === "pages"
      ? pagesCacheName(activeContentHash)
      : assetsCacheName(activeAssetsHash);
  const cache = await caches.open(name);
  await cache.put(request, response);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    fetchManifest()
      .then((manifest) => {
        if (manifest?.contentHash) activeContentHash = manifest.contentHash;
        if (manifest?.assetsHash) activeAssetsHash = manifest.assetsHash;
      })
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

  if (data.type !== "PRECACHE_BATCH") return;

  const urls = data.urls || [];
  const bucket = data.bucket === "assets" ? "assets" : "pages";
  const port = event.ports?.[0];

  if (data.contentHash) activeContentHash = data.contentHash;
  if (data.assetsHash) activeAssetsHash = data.assetsHash;

  event.waitUntil(
    (async () => {
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

  event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
  const cached = await matchCaches(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const bucket = request.url.includes("/_next/static/") ? "assets" : "pages";
      if (activeContentHash && activeAssetsHash) {
        await putInCache(request, response.clone(), bucket);
      }
    }
    return response;
  } catch {
    if (isDocumentRequest(request)) {
      const fallback = await matchCaches(new Request("/offline-fallback.html"));
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
