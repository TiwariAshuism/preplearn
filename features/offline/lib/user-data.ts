import { deleteKV, getKV, setKV } from "./db";

const MIGRATION_FLAG = "meta:localStorage-migrated";

/** User progress, checklists — IndexedDB (fast for structured JSON). */
export async function getUserData<T>(key: string): Promise<T | undefined> {
  await migrateFromLocalStorage();
  return getKV<T>(key);
}

export async function setUserData<T>(key: string, value: T): Promise<void> {
  await setKV(key, value);
}

export async function migrateFromLocalStorage(): Promise<void> {
  if (typeof window === "undefined") return;

  const migrated = await getKV<boolean>(MIGRATION_FLAG);
  if (migrated) return;

  try {
    const keysToMigrate: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith("preplearn:") || key.startsWith("preplearn:progress:"))
      ) {
        keysToMigrate.push(key);
      }
    }

    for (const key of keysToMigrate) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        await setKV(key, JSON.parse(raw));
      } catch {
        await setKV(key, raw);
      }
      localStorage.removeItem(key);
    }
  } catch {
    /* ignore migration errors */
  }

  await setKV(MIGRATION_FLAG, true);
}

export async function clearUserData(key: string): Promise<void> {
  await deleteKV(key);
}
