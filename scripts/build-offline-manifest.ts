import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getAllSlugs } from "../features/mdx-parser/lib/content";
import { slugToHref } from "../features/mdx-parser/lib/collection";

const CONTENT_DIR = path.join(process.cwd(), "content");
const OUT_PATH = path.join(process.cwd(), "public", "offline-routes.json");
const SEARCH_PATH = path.join(process.cwd(), "public", "search-index.json");
const SW_PATH = path.join(process.cwd(), "public", "sw.js");

function hashPayload(payload: string): string {
  return crypto.createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

function collectMarkdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectMarkdownFiles(full));
    } else if (entry.name.endsWith(".md")) {
      results.push(full);
    }
  }
  return results;
}

/** Hash full markdown bodies so content edits always bump contentHash. */
function hashContentCorpus(): string {
  const files = collectMarkdownFiles(CONTENT_DIR)
    .map((filePath) => path.relative(CONTENT_DIR, filePath).replace(/\\/g, "/"))
    .sort();

  const hasher = crypto.createHash("sha256");
  for (const relative of files) {
    const full = path.join(CONTENT_DIR, relative);
    hasher.update(relative);
    hasher.update("\0");
    hasher.update(fs.readFileSync(full));
    hasher.update("\0");
  }
  return hasher.digest("hex").slice(0, 16);
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

/** Stamp BUILD_HASH into sw.js so content/asset deploys trigger SW install. */
function stampServiceWorker(buildHash: string): void {
  if (!fs.existsSync(SW_PATH)) return;

  const raw = fs.readFileSync(SW_PATH, "utf-8");
  const next = raw.replace(
    /\/\* BUILD_HASH:.*? \*\//,
    `/* BUILD_HASH: ${buildHash} */`,
  );

  if (next !== raw) {
    fs.writeFileSync(SW_PATH, next);
    console.log(`Stamped sw.js BUILD_HASH: ${buildHash}`);
  }
}

function buildOfflineManifest() {
  const pages = [
    "/",
    "/templates",
    ...getAllSlugs().map((slug) => slugToHref(slug)),
  ];

  const contentAssets = ["/search-index.json"];

  // Do not list offline-routes.json here — it must never enter Cache API.
  const buildAssets = [
    "/sw.js",
    "/manifest.json",
    "/offline-fallback.html",
    "/icons/icon.svg",
    ...collectStaticAssets(),
  ].sort();

  const searchIndexRaw = fs.existsSync(SEARCH_PATH)
    ? fs.readFileSync(SEARCH_PATH, "utf-8")
    : "";

  const markdownHash = hashContentCorpus();

  const contentHash = hashPayload(
    JSON.stringify({
      pages: [...pages].sort(),
      contentAssets: [...contentAssets].sort(),
      searchIndex: searchIndexRaw,
      markdownHash,
    }),
  );

  const assetsHash = hashPayload(JSON.stringify({ buildAssets }));

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
  stampServiceWorker(`${contentHash}-${assetsHash}`);

  console.log(
    `Wrote offline manifest: ${pages.length} pages, content ${contentHash}, assets ${assetsHash}`,
  );
}

buildOfflineManifest();
