import fs from "fs";
import path from "path";

export type SyncRootMeta = {
  id: string;
  title: string;
  slug: string;
  pageCount: number;
  syncedAt: string;
};

export type SyncMeta = {
  lastSyncedAt: string;
  roots: SyncRootMeta[];
};

const META_PATH = path.join(process.cwd(), "content", ".sync-meta.json");

export function readSyncMeta(): SyncMeta | null {
  if (!fs.existsSync(META_PATH)) return null;

  try {
    return JSON.parse(fs.readFileSync(META_PATH, "utf-8")) as SyncMeta;
  } catch {
    return null;
  }
}

export function writeSyncMeta(meta: SyncMeta): void {
  fs.mkdirSync(path.dirname(META_PATH), { recursive: true });
  fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2));
}

export function upsertSyncRoot(root: SyncRootMeta): SyncMeta {
  const existing = readSyncMeta();
  const roots = existing?.roots.filter((r) => r.id !== root.id) ?? [];
  roots.push(root);
  roots.sort((a, b) => a.title.localeCompare(b.title));

  const meta: SyncMeta = {
    lastSyncedAt: root.syncedAt,
    roots,
  };

  writeSyncMeta(meta);
  return meta;
}

export function formatSyncDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}
