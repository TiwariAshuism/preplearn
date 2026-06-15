"use client";

import { useEffect, useState } from "react";
import {
  isOnline,
  registerServiceWorker,
  syncOfflineCacheIfNeeded,
  getOfflineCacheStats,
  fetchOfflineManifest,
  type OfflineCacheProgress,
} from "../lib/sw-client";
import { refreshSearchIndexIfNeeded } from "../lib/search-cache";
import { migrateFromLocalStorage } from "../lib/user-data";

function OfflineIndicator({
  progress,
  cacheReady,
}: {
  progress: OfflineCacheProgress | null;
  cacheReady: boolean;
}) {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(isOnline());
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (!progress && online) return null;

  let label = "Offline mode";
  if (online && progress?.status === "caching") {
    const pct =
      progress.total > 0
        ? Math.round((progress.cached / progress.total) * 100)
        : 0;
    const kind =
      progress.label === "assets"
        ? "UI assets"
        : progress.label === "content"
          ? "content"
          : "library";
    label = `Downloading offline ${kind}… ${pct}%`;
  } else if (online && progress?.status === "ready") {
    label = "Offline library ready";
  } else if (online && progress?.status === "skipped" && cacheReady) {
    return null;
  } else if (online && progress?.status === "error") {
    label = "Offline download failed — retry when online";
  } else if (!online) {
    label = cacheReady
      ? "Offline — library ready"
      : "Offline — open online once to download";
  }

  if (online && progress?.status === "skipped" && cacheReady) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 max-w-[16rem] rounded-full border border-zinc-200 bg-white/95 px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95 dark:text-zinc-300"
      role="status"
      aria-live="polite"
    >
      <span
        className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
          online
            ? progress?.status === "error"
              ? "bg-red-500"
              : "bg-emerald-500"
            : cacheReady
              ? "bg-emerald-500"
              : "bg-amber-500"
        }`}
        aria-hidden
      />
      {label}
    </div>
  );
}

export function OfflineManager() {
  const [progress, setProgress] = useState<OfflineCacheProgress | null>(null);
  const [cacheReady, setCacheReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkCacheReady() {
      const manifest = await fetchOfflineManifest();
      if (!manifest?.contentHash) {
        if (!cancelled) setCacheReady(false);
        return;
      }
      const stats = await getOfflineCacheStats(manifest.contentHash);
      const minimum = Math.max(3, Math.floor(manifest.pageCount * 0.9));
      if (!cancelled) {
        setCacheReady((stats?.pageCount ?? 0) >= minimum);
      }
    }

    async function runSync() {
      await refreshSearchIndexIfNeeded();

      const result = await syncOfflineCacheIfNeeded((p) => {
        if (!cancelled) setProgress(p);
      });

      if (!cancelled) {
        setCacheReady(result.ready);
      }

      if (!cancelled && result.updated) {
        await refreshSearchIndexIfNeeded();
      }
    }

    async function init() {
      await migrateFromLocalStorage();

      const reg = await registerServiceWorker();
      if (!reg || cancelled) return;

      if (!navigator.onLine) {
        await checkCacheReady();
        setProgress({ total: 0, cached: 0, status: "skipped" });
        return;
      }

      await runSync();
    }

    init();

    const onOnline = async () => {
      await runSync();
    };

    const onVisible = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        runSync();
      }
    };

    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return <OfflineIndicator progress={progress} cacheReady={cacheReady} />;
}
