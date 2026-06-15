import { getKV, setKV } from "./db";

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
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    return null;
  }
}

function waitForController(): Promise<ServiceWorker | null> {
  return new Promise((resolve) => {
    if (navigator.serviceWorker.controller) {
      resolve(navigator.serviceWorker.controller);
      return;
    }

    const timeout = setTimeout(() => resolve(null), 5000);
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => {
        clearTimeout(timeout);
        resolve(navigator.serviceWorker.controller);
      },
      { once: true },
    );
  });
}

function postMessage<T>(message: object): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const controller = await waitForController();
    if (!controller) {
      reject(new Error("No service worker controller"));
      return;
    }

    const channel = new MessageChannel();
    channel.port1.onmessage = (e) => resolve(e.data as T);
    controller.postMessage(message, [channel.port2]);
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
    /* SW not ready */
  }
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

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    try {
      const result = await postMessage<{ cached: number }>({
        type: "PRECACHE_BATCH",
        urls: batch,
        bucket,
        contentHash: manifest.contentHash,
        assetsHash: manifest.assetsHash,
      });
      done += result.cached ?? 0;
    } catch {
      /* continue */
    }

    onProgress?.({
      total,
      cached: Math.min(done, total),
      status: "caching",
      label: bucket === "pages" ? "content" : "assets",
    });

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
): Promise<{ updated: boolean }> {
  const manifest = await fetchOfflineManifest();
  if (!manifest?.contentHash || !manifest?.assetsHash) {
    onProgress?.({ total: 0, cached: 0, status: "error" });
    return { updated: false };
  }

  const stored = await getStoredHashes();
  const contentChanged = stored.contentHash !== manifest.contentHash;
  const assetsChanged = stored.assetsHash !== manifest.assetsHash;

  if (!contentChanged && !assetsChanged) {
    onProgress?.({
      total: manifest.pageCount,
      cached: manifest.pageCount,
      status: "skipped",
    });
    await syncVersionsWithSw(manifest);
    return { updated: false };
  }

  await syncVersionsWithSw(manifest);

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

  await setStoredHashes(manifest.contentHash, manifest.assetsHash);
  onProgress?.({ total: totalWork, cached: totalWork, status: "ready" });

  return { updated: true };
}

export function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

/** @deprecated use getStoredHashes */
export async function getStoredContentHash(): Promise<string | undefined> {
  return (await getStoredHashes()).contentHash;
}
