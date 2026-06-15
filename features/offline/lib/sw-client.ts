import { getKV, setKV, deleteKV } from "./db";
import { isOfflineEnabled } from "./env";

const CONTENT_HASH_KEY = "meta:offline-content-hash";
const ASSETS_HASH_KEY = "meta:offline-assets-hash";

export type OfflineManifest = {
  contentHash: string;
  assetsHash: string;
  pageCount: number;
  pages: string[];
  contentAssets: string[];
  buildAssets: string[];
};

export type OfflineCacheProgress = {
  total: number;
  cached: number;
  status: "idle" | "caching" | "ready" | "skipped" | "error";
  label?: string;
};

type StoredHashes = {
  contentHash?: string;
  assetsHash?: string;
};

type CacheStats = {
  pageCount: number;
};

const MIN_CACHED_PAGES_RATIO = 0.9;

export async function getStoredHashes(): Promise<StoredHashes> {
  const [contentHash, assetsHash] = await Promise.all([
    getKV<string>(CONTENT_HASH_KEY),
    getKV<string>(ASSETS_HASH_KEY),
  ]);
  return { contentHash, assetsHash };
}

export async function setStoredHashes(
  contentHash: string,
  assetsHash: string,
): Promise<void> {
  await Promise.all([
    setKV(CONTENT_HASH_KEY, contentHash),
    setKV(ASSETS_HASH_KEY, assetsHash),
  ]);
}

export async function clearStoredHashes(): Promise<void> {
  await Promise.all([
    deleteKV(CONTENT_HASH_KEY),
    deleteKV(ASSETS_HASH_KEY),
  ]);
}

export async function fetchOfflineManifest(): Promise<OfflineManifest | null> {
  try {
    const res = await fetch("/offline-routes.json", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as OfflineManifest;
  } catch {
    return null;
  }
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isOfflineEnabled()) return null;

  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    await navigator.serviceWorker.ready;
    return registration;
  } catch {
    return null;
  }
}

async function getActiveWorker(): Promise<ServiceWorker | null> {
  await navigator.serviceWorker.ready;
  const registration = await navigator.serviceWorker.getRegistration();
  return registration?.active ?? navigator.serviceWorker.controller;
}

function postMessage<T>(message: object): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const worker = await getActiveWorker();
    if (!worker) {
      reject(new Error("No active service worker"));
      return;
    }

    const channel = new MessageChannel();
    channel.port1.onmessage = (event) => resolve(event.data as T);
    channel.port1.onmessageerror = () =>
      reject(new Error("Service worker message error"));
    worker.postMessage(message, [channel.port2]);
  });
}

async function syncVersionsWithSw(manifest: OfflineManifest): Promise<void> {
  try {
    await postMessage({
      type: "SET_VERSIONS",
      contentHash: manifest.contentHash,
      assetsHash: manifest.assetsHash,
    });
  } catch {
    /* SW not ready yet */
  }
}

export async function getOfflineCacheStats(
  contentHash?: string,
): Promise<CacheStats | null> {
  try {
    return await postMessage<CacheStats>({
      type: "GET_CACHE_STATS",
      contentHash,
    });
  } catch {
    return null;
  }
}

async function isCacheComplete(
  manifest: OfflineManifest,
  stored: StoredHashes,
): Promise<boolean> {
  if (
    stored.contentHash !== manifest.contentHash ||
    stored.assetsHash !== manifest.assetsHash
  ) {
    return false;
  }

  const stats = await getOfflineCacheStats(manifest.contentHash);
  if (!stats) return false;

  const minimum = Math.max(3, Math.floor(manifest.pageCount * MIN_CACHED_PAGES_RATIO));
  return stats.pageCount >= minimum;
}

async function precacheUrls(
  urls: string[],
  bucket: "pages" | "assets",
  manifest: OfflineManifest,
  onProgress?: (progress: OfflineCacheProgress) => void,
  progressBase?: { cached: number; total: number },
): Promise<number> {
  const batchSize = 8;
  let done = progressBase?.cached ?? 0;
  const total = progressBase?.total ?? urls.length;
  let batchFailures = 0;

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    try {
      const result = await postMessage<{ cached: number; total: number }>({
        type: "PRECACHE_BATCH",
        urls: batch,
        bucket,
        contentHash: manifest.contentHash,
        assetsHash: manifest.assetsHash,
      });
      done += result.cached ?? 0;
      if ((result.cached ?? 0) === 0 && batch.length > 0) {
        batchFailures++;
      }
    } catch {
      batchFailures++;
    }

    onProgress?.({
      total,
      cached: Math.min(done, total),
      status: "caching",
      label: bucket === "pages" ? "content" : "assets",
    });

    if (batchFailures >= 3) break;

    if (
      (navigator as Navigator & { connection?: { saveData?: boolean } })
        .connection?.saveData
    ) {
      break;
    }
    await new Promise((r) => setTimeout(r, 50));
  }

  return done;
}

/**
 * Re-cache pages only when contentHash changes, build assets only when assetsHash changes.
 */
export async function syncOfflineCacheIfNeeded(
  onProgress?: (progress: OfflineCacheProgress) => void,
): Promise<{ updated: boolean; ready: boolean }> {
  if (!isOfflineEnabled()) {
    return { updated: false, ready: false };
  }

  const manifest = await fetchOfflineManifest();
  if (!manifest?.contentHash || !manifest?.assetsHash) {
    onProgress?.({ total: 0, cached: 0, status: "error" });
    return { updated: false, ready: false };
  }

  const stored = await getStoredHashes();
  let contentChanged = stored.contentHash !== manifest.contentHash;
  let assetsChanged = stored.assetsHash !== manifest.assetsHash;

  await syncVersionsWithSw(manifest);

  if (!contentChanged && !assetsChanged) {
    const ready = await isCacheComplete(manifest, stored);
    if (ready) {
      onProgress?.({
        total: manifest.pageCount,
        cached: manifest.pageCount,
        status: "skipped",
      });
      return { updated: false, ready: true };
    }

    await clearStoredHashes();
    contentChanged = true;
    assetsChanged = true;
  }

  const contentUrls = [...manifest.pages, ...manifest.contentAssets];
  const assetUrls = manifest.buildAssets;

  const totalWork =
    (contentChanged ? contentUrls.length : 0) +
    (assetsChanged ? assetUrls.length : 0);

  let completed = 0;

  if (contentChanged) {
    onProgress?.({
      total: totalWork,
      cached: completed,
      status: "caching",
      label: "content",
    });
    completed += await precacheUrls(
      contentUrls,
      "pages",
      manifest,
      onProgress,
      { cached: completed, total: totalWork },
    );
  }

  if (assetsChanged) {
    onProgress?.({
      total: totalWork,
      cached: completed,
      status: "caching",
      label: "assets",
    });
    await precacheUrls(assetUrls, "assets", manifest, onProgress, {
      cached: completed,
      total: totalWork,
    });
  }

  const ready = await isCacheComplete(manifest, {
    contentHash: manifest.contentHash,
    assetsHash: manifest.assetsHash,
  });

  if (ready) {
    await setStoredHashes(manifest.contentHash, manifest.assetsHash);
    onProgress?.({ total: totalWork, cached: totalWork, status: "ready" });
    return { updated: true, ready: true };
  }

  await clearStoredHashes();
  onProgress?.({ total: totalWork, cached: completed, status: "error" });
  return { updated: false, ready: false };
}

export function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

/** @deprecated use getStoredHashes */
export async function getStoredContentHash(): Promise<string | undefined> {
  return (await getStoredHashes()).contentHash;
}
