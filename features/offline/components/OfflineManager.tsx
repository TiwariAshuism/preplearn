"use client";

import { useEffect, useState } from "react";
import {
  isOnline,
  registerServiceWorker,
  syncOfflineCacheIfNeeded,
  type OfflineCacheProgress,
} from "../lib/sw-client";
import { refreshSearchIndexIfNeeded } from "../lib/search-cache";
import { migrateFromLocalStorage } from "../lib/user-data";

function OfflineIndicator({ progress }: { progress: OfflineCacheProgress | null }) {
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
    label = `Updating offline library… ${pct}%`;
  } else if (online && progress?.status === "ready") {
    label = "Offline library updated";
  } else if (online && progress?.status === "skipped") {
    return null;
  } else if (!online) {
    label =
      progress?.status === "ready" || progress?.status === "skipped"
        ? "Offline — ready"
        : "Offline";
  }

  if (online && progress?.status === "skipped") return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 max-w-[14rem] rounded-full border border-zinc-200 bg-white/95 px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95 dark:text-zinc-300"
      role="status"
      aria-live="polite"
    >
      <span
        className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
          online ? "bg-emerald-500" : "bg-amber-500"
        }`}
        aria-hidden
      />
      {label}
    </div>
  );
}

export function OfflineManager() {
  const [progress, setProgress] = useState<OfflineCacheProgress | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      await migrateFromLocalStorage();

      const reg = await registerServiceWorker();
      if (!reg || cancelled) return;

      if (!navigator.onLine) {
        setProgress({ total: 0, cached: 0, status: "skipped" });
        return;
      }

      await refreshSearchIndexIfNeeded();

      const { updated } = await syncOfflineCacheIfNeeded((p) => {
        if (!cancelled) setProgress(p);
      });

      if (!cancelled && updated) {
        await refreshSearchIndexIfNeeded();
      }
    }

    init();

    const onOnline = async () => {
      await refreshSearchIndexIfNeeded();
      await syncOfflineCacheIfNeeded((p) => setProgress(p));
    };
    window.addEventListener("online", onOnline);

    return () => {
      cancelled = true;
      window.removeEventListener("online", onOnline);
    };
  }, []);

  return <OfflineIndicator progress={progress} />;
}
