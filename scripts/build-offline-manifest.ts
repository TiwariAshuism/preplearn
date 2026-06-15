import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getAllSlugs } from "../features/mdx-parser/lib/content";
import { slugToHref } from "../features/mdx-parser/lib/collection";

const OUT_PATH = path.join(process.cwd(), "public", "offline-routes.json");
const SEARCH_PATH = path.join(process.cwd(), "public", "search-index.json");

function hashPayload(payload: string): string {
  return crypto.createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

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

function buildOfflineManifest() {
  const pages = [
    "/",
    "/templates",
    ...getAllSlugs().map((slug) => slugToHref(slug)),
  ];

  const contentAssets = ["/search-index.json"];

  const buildAssets = [
    "/sw.js",
    "/manifest.json",
    "/offline-fallback.html",
    "/offline-routes.json",
    "/icons/icon.svg",
    ...collectStaticAssets(),
  ].sort();

  const searchIndexRaw = fs.existsSync(SEARCH_PATH)
    ? fs.readFileSync(SEARCH_PATH, "utf-8")
    : "";

  const contentHash = hashPayload(
    JSON.stringify({
      pages: [...pages].sort(),
      contentAssets: [...contentAssets].sort(),
      searchIndex: searchIndexRaw,
    }),
  );

  const assetsHash = hashPayload(
    JSON.stringify({ buildAssets }),
  );

  const manifest = {
    contentHash,
    assetsHash,
    pageCount: pages.length,
    pages,
    contentAssets,
    buildAssets,
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(manifest));
  console.log(
    `Wrote offline manifest: ${pages.length} pages, content ${contentHash}, assets ${assetsHash}`,
  );
}

buildOfflineManifest();
