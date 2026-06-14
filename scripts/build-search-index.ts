import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getAllSlugs, slugToFilePath } from "../features/mdx-parser/lib/content";
import { slugToHref, getCollectionRootForSlug } from "../features/mdx-parser/lib/collection";
import type { SearchEntry } from "../features/mdx-parser/lib/search";

const OUT_PATH = path.join(process.cwd(), "public", "search-index.json");

function excerpt(body: string, max = 140): string {
  for (const line of body.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || t.startsWith("|") || t.startsWith("```"))
      continue;
    if (t.startsWith(">")) return t.replace(/^>\s*/, "").slice(0, max);
    return t.replace(/\*\*/g, "").slice(0, max);
  }
  return "";
}

function buildSearchIndex(): SearchEntry[] {
  const entries: SearchEntry[] = [];

  for (const slug of getAllSlugs()) {
    const filePath = slugToFilePath(slug);
    if (!filePath) continue;

    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);
    const title =
      (typeof data.title === "string" && data.title) ||
      content.match(/^#\s+(.+)$/m)?.[1]?.trim() ||
      slug.join("/");

    const root = getCollectionRootForSlug(slug);

    entries.push({
      title,
      href: slugToHref(slug),
      excerpt: excerpt(content),
      collection: root?.title ?? title,
    });
  }

  return entries.sort((a, b) => a.title.localeCompare(b.title));
}

const index = buildSearchIndex();
fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(index));
console.log(`Wrote ${index.length} entries to public/search-index.json`);
