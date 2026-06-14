import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { NavNode, ParsedPage } from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content");

export type CollectionRootInfo = {
  slug: string[];
  href: string;
  title: string;
  childSlugs: string[];
  source: "notion" | "manual";
  notionRootId: string | null;
};

export function slugToHref(slug: string[]): string {
  if (slug.length === 0) return "/templates";
  return `/templates/${slug.join("/")}`;
}

export function isCollectionRoot(
  parsed: ParsedPage,
  filePath: string,
): boolean {
  const { notionId, notionRootId, parent } = parsed.frontmatter;
  if (notionId && notionRootId && notionId === notionRootId) return true;
  if (parent === null) return true;

  const relative = path.relative(CONTENT_DIR, filePath).replace(/\\/g, "/");
  return relative === "index.md";
}

function parseIndexMeta(indexPath: string) {
  const { data } = matter(fs.readFileSync(indexPath, "utf-8"));
  const children = Array.isArray(data.children)
    ? data.children.filter((c): c is string => typeof c === "string")
    : [];

  return {
    title: typeof data.title === "string" ? data.title : path.basename(path.dirname(indexPath)),
    childSlugs: children.map((c) => (c.includes("/") ? c.split("/")[0] : c)),
    source: data.source === "notion" || data.notionId ? "notion" as const : "manual" as const,
    notionRootId: typeof data.notionRootId === "string" ? data.notionRootId : null,
    order: typeof data.order === "number" ? data.order : 0,
    icon: typeof data.icon === "string" ? data.icon : null,
  };
}

function readRootIndexCollectionRoot(): CollectionRootInfo | null {
  const rootIndexPath = path.join(CONTENT_DIR, "index.md");
  if (!fs.existsSync(rootIndexPath)) return null;

  const raw = fs.readFileSync(rootIndexPath, "utf-8");
  const { data, content } = matter(raw);
  const parsed: ParsedPage = {
    frontmatter: {
      source: data.source === "notion" ? "notion" : "manual",
      title: typeof data.title === "string" ? data.title : "Roadmaps",
      slug:
        typeof data.slug === "string" && data.slug.trim()
          ? data.slug
          : "index",
      notionId: typeof data.notionId === "string" ? data.notionId : null,
      notionRootId:
        typeof data.notionRootId === "string" ? data.notionRootId : null,
      parent: data.parent === null ? null : typeof data.parent === "string" ? data.parent : null,
      children: [],
      order: 0,
      icon: null,
      cover: null,
    },
    content,
    filePath: rootIndexPath,
    slug:
      typeof data.slug === "string" && data.slug.trim()
        ? data.slug.split("/").filter(Boolean)
        : [],
  };

  if (!isCollectionRoot(parsed, rootIndexPath)) return null;

  const meta = parseIndexMeta(rootIndexPath);
  const slug =
    typeof data.slug === "string" && data.slug.trim()
      ? data.slug.split("/").filter(Boolean)
      : [];

  return {
    slug,
    href: slugToHref(slug),
    title: meta.title,
    childSlugs: meta.childSlugs,
    source: meta.source,
    notionRootId: meta.notionRootId,
  };
}

export function getAllCollectionRoots(): CollectionRootInfo[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  const roots: CollectionRootInfo[] = [];

  const rootIndex = readRootIndexCollectionRoot();
  if (rootIndex) roots.push(rootIndex);

  for (const entry of fs.readdirSync(CONTENT_DIR, { withFileTypes: true })) {
    if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue;

    if (!entry.isDirectory()) continue;

    const indexPath = path.join(CONTENT_DIR, entry.name, "index.md");
    if (!fs.existsSync(indexPath)) continue;

    const raw = fs.readFileSync(indexPath, "utf-8");
    const { data, content } = matter(raw);
    const parsed: ParsedPage = {
      frontmatter: {
        source: data.source === "notion" ? "notion" : "manual",
        title: typeof data.title === "string" ? data.title : entry.name,
        slug: entry.name,
        notionId: typeof data.notionId === "string" ? data.notionId : null,
        notionRootId: typeof data.notionRootId === "string" ? data.notionRootId : null,
        parent: data.parent === null ? null : typeof data.parent === "string" ? data.parent : null,
        children: [],
        order: 0,
        icon: null,
        cover: null,
      },
      content,
      filePath: indexPath,
      slug: [entry.name],
    };

    if (!isCollectionRoot(parsed, indexPath)) continue;

    const meta = parseIndexMeta(indexPath);
    roots.push({
      slug: [entry.name],
      href: slugToHref([entry.name]),
      title: meta.title,
      childSlugs: meta.childSlugs,
      source: meta.source,
      notionRootId: meta.notionRootId,
    });
  }

  return roots.sort((a, b) => a.title.localeCompare(b.title));
}

export function getCollectionRootForSlug(
  slug: string[],
): CollectionRootInfo | null {
  if (slug.length === 0) return null;

  const roots = getAllCollectionRoots();

  for (const root of roots.sort((a, b) => b.slug.length - a.slug.length)) {
    const rootKey = root.slug.join("/");
    const slugKey = slug.slice(0, root.slug.length).join("/");
    if (rootKey && rootKey === slugKey) return root;
  }

  for (const root of roots) {
    if (root.childSlugs.includes(slug[0])) return root;
  }

  return null;
}

/** @deprecated use getCollectionRootForSlug */
export function belongsToRootCollection(slug: string[]): boolean {
  const root = getCollectionRootForSlug(slug);
  if (!root) return false;
  return root.childSlugs.includes(slug[0]) || slug.join("/").startsWith(root.slug.join("/"));
}

export function getCollectionRootSlug(slug: string[]): string[] {
  const root = getCollectionRootForSlug(slug);
  if (!root) return slug.length > 0 ? [slug[0]] : [];
  if (root.childSlugs.includes(slug[0])) return root.slug;
  return root.slug;
}
