import type { SearchEntry } from "@/features/mdx-parser/lib/search";
import { getKV, setKV } from "./db";
import {
  fetchOfflineManifest,
  getStoredContentHash,
} from "./sw-client";

const SEARCH_KEY = "cache:search-index";
const SEARCH_HASH_KEY = "cache:search-index-hash";

export async function loadSearchIndex(): Promise<SearchEntry[]> {
  const cached = await getKV<SearchEntry[]>(SEARCH_KEY);
  if (cached && cached.length > 0) return cached;

  try {
    const res = await fetch("/search-index.json");
    if (!res.ok) return cached ?? [];
    const data = (await res.json()) as SearchEntry[];
    const manifest = await fetchOfflineManifest();
    await setKV(SEARCH_KEY, data);
    if (manifest?.contentHash) {
      await setKV(SEARCH_HASH_KEY, manifest.contentHash);
    }
    return data;
  } catch {
    return cached ?? [];
  }
}

/** Refresh search index only when deploy content hash changed. */
export async function refreshSearchIndexIfNeeded(): Promise<SearchEntry[]> {
  const cached = (await getKV<SearchEntry[]>(SEARCH_KEY)) ?? [];
  const storedHash = await getKV<string>(SEARCH_HASH_KEY);
  const manifest = await fetchOfflineManifest();

  if (
    manifest?.contentHash &&
    storedHash === manifest.contentHash &&
    cached.length > 0
  ) {
    return cached;
  }

  try {
    const res = await fetch("/search-index.json", { cache: "no-store" });
    if (!res.ok) return cached;
    const data = (await res.json()) as SearchEntry[];
    await setKV(SEARCH_KEY, data);
    if (manifest?.contentHash) {
      await setKV(SEARCH_HASH_KEY, manifest.contentHash);
    }
    return data;
  } catch {
    return cached;
  }
}
