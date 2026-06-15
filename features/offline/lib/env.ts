/** Offline/PWA is production-only — SW breaks Next.js dev (HMR, dynamic chunks). */
export function isOfflineEnabled(): boolean {
  return process.env.NODE_ENV === "production";
}

export async function teardownOfflineClient(): Promise<void> {
  if (typeof window === "undefined") return;

  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) await registration.unregister();
  }

  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
}
