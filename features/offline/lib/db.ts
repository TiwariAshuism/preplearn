import { openDB, type DBSchema, type IDBPDatabase } from "idb";

const DB_NAME = "preplearn-offline";
const DB_VERSION = 1;

interface PrepLearnDB extends DBSchema {
  kv: {
    key: string;
    value: unknown;
  };
}

let dbPromise: Promise<IDBPDatabase<PrepLearnDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<PrepLearnDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("kv")) {
          db.createObjectStore("kv");
        }
      },
    });
  }
  return dbPromise;
}

export async function getKV<T>(key: string): Promise<T | undefined> {
  const db = await getDB();
  return db.get("kv", key) as Promise<T | undefined>;
}

export async function setKV(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  await db.put("kv", value, key);
}

export async function deleteKV(key: string): Promise<void> {
  const db = await getDB();
  await db.delete("kv", key);
}
