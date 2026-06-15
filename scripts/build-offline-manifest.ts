import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getAllSlugs } from "../features/mdx-parser/lib/content";
import { slugToHref } from "../features/mdx-parser/lib/collection";

const OUT_PATH = path.join(process.cwd(), "public", "offline-routes.json");
const SEARCH_PATH = path.join(process.cwd(), "public", "search-index.json");

function collectStaticAssets(): string[] {
  const staticDir = path.join(process.cwd(), ".next", "static");
  const assets: string[] = [];

  if (!fs.existsSync(staticDir)) return assets;

  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else {
        const relative = path.relative(staticDir, full).replace(/\\/g, "/");
        assets.push(`/_next/static/${relative}`);
      }
    }
  }

  walk(staticDir);
  return assets.sort();
}

function buildContentHash(
  pages: string[],
  assets: string[],
  searchIndexRaw: string,
): string {
  const payload = JSON.stringify({
    pages: [...pages].sort(),
    assets: [...assets].sort(),
  });

  return crypto
    .createHash("sha256")
    .update(payload)
    .update(searchIndexRaw)
    .digest("hex")
    .slice(0, 16);
}

function buildOfflineManifest() {
  const pages = [
    "/",
    "/templates",
    ...getAllSlugs().map((slug) => slugToHref(slug)),
  ];

  const coreAssets = [
    "/manifest.json",
    "/search-index.json",
    "/offline-fallback.html",
    "/icons/icon.svg",
  ];

  const staticAssets = collectStaticAssets();
  const assets = [...coreAssets, ...staticAssets];

  const searchIndexRaw = fs.existsSync(SEARCH_PATH)
    ? fs.readFileSync(SEARCH_PATH, "utf-8")
    : "";

  const contentHash = buildContentHash(pages, assets, searchIndexRaw);

  const manifest = {
    contentHash,
    pageCount: pages.length,
    pages,
    assets,
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(manifest));
  console.log(
    `Wrote offline manifest: ${pages.length} pages, hash ${contentHash}`,
  );
}

buildOfflineManifest();
