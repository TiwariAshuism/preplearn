import { getKV, setKV } from "./db";

const MANIFEST_VERSION_KEY = "meta:offline-content-hash";

export type OfflineManifest = {
  contentHash: string;
  pageCount: number;
  pages: string[];
  assets: string[];
};

export type OfflineCacheProgress = {
  total: number;
  cached: number;
  status: "idle" | "caching" | "ready" | "skipped" | "error";
};

export async function getStoredContentHash(): Promise<string | undefined> {
  return getKV<string>(MANIFEST_VERSION_KEY);
}

export async function setStoredContentHash(hash: string): Promise<void> {
  await setKV(MANIFEST_VERSION_KEY, hash);
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
    const reg = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    if (reg.waiting) {
      reg.waiting.postMessage({ type: "SKIP_WAITING" });
    }

    return reg;
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

async function precacheManifest(
  manifest: OfflineManifest,
  onProgress?: (progress: OfflineCacheProgress) => void,
): Promise<void> {
  const urls = [...manifest.pages, ...manifest.assets];
  const total = urls.length;

  onProgress?.({ total, cached: 0, status: "caching" });

  try {
    await postMessage({ type: "SET_CONTENT_HASH", contentHash: manifest.contentHash });
  } catch {
    /* SW may not be ready yet */
  }

  const batchSize = 8;
  let cached = 0;

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    try {
      const result = await postMessage<{ cached: number }>({
        type: "PRECACHE_BATCH",
        urls: batch,
        contentHash: manifest.contentHash,
      });
      cached += result.cached ?? 0;
    } catch {
      /* continue */
    }

    onProgress?.({
      total,
      cached: Math.min(cached, total),
      status: "caching",
    });

    if (
      (navigator as Navigator & { connection?: { saveData?: boolean } })
        .connection?.saveData
    ) {
      break;
    }
    await new Promise((r) => setTimeout(r, 50));
  }

  await setStoredContentHash(manifest.contentHash);
  onProgress?.({ total, cached: total, status: "ready" });
}

/**
 * Compare deploy fingerprint with IndexedDB. Only bulk-download when content changed.
 */
export async function syncOfflineCacheIfNeeded(
  onProgress?: (progress: OfflineCacheProgress) => void,
): Promise<{ updated: boolean; contentHash: string | null }> {
  const manifest = await fetchOfflineManifest();
  if (!manifest?.contentHash) {
    onProgress?.({ total: 0, cached: 0, status: "error" });
    return { updated: false, contentHash: null };
  }

  const stored = await getStoredContentHash();

  if (stored === manifest.contentHash) {
    onProgress?.({
      total: manifest.pageCount,
      cached: manifest.pageCount,
      status: "skipped",
    });

    try {
      await postMessage({
        type: "SET_CONTENT_HASH",
        contentHash: manifest.contentHash,
      });
    } catch {
      /* already cached */
    }

    return { updated: false, contentHash: manifest.contentHash };
  }

  await precacheManifest(manifest, onProgress);
  return { updated: true, contentHash: manifest.contentHash };
}

export function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}
