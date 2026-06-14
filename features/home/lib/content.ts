import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getAllSlugs, resolveChildSlugParts } from "@/features/mdx-parser/lib/content";
import { extractEstimatedDays } from "@/features/mdx-parser/lib/page-context";
import { inferRoadmapCategory, type RoadmapCategory } from "./categories";

const CONTENT_DIR = path.join(process.cwd(), "content");

export type HomeCollectionItem = {
  title: string;
  href: string;
  icon: string | null;
  order: number;
  estimatedDays: string | null;
};

export type HomeCollection = {
  title: string;
  description: string;
  href: string;
  slugKey: string;
  category: RoadmapCategory;
  icon: string | null;
  order: number;
  childCount: number;
  children: HomeCollectionItem[];
};

export type HomePageLink = {
  title: string;
  href: string;
  icon: string | null;
  order: number;
};

export type HomeContent = {
  collections: HomeCollection[];
  standalonePages: HomePageLink[];
  stats: {
    collectionCount: number;
    phaseCount: number;
    totalPages: number;
  };
};

function slugToHref(slug: string[]): string {
  if (slug.length === 0) return "/templates";
  return `/templates/${slug.join("/")}`;
}

function extractDescription(body: string, maxLength = 160): string {
  const lines = body.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === "---") continue;
    if (trimmed.startsWith("#")) continue;
    if (trimmed.startsWith(">")) {
      return trimmed
        .replace(/^>\s*/, "")
        .replace(/\*\*/g, "")
        .slice(0, maxLength);
    }
    if (trimmed.startsWith("|") || trimmed.startsWith("```")) continue;

    const text = trimmed.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
    if (text.length > 0) return text.slice(0, maxLength);
  }

  return "Structured learning path with phases, topics, and projects.";
}

function parseMdFile(filePath: string) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return { frontmatter: data as Record<string, unknown>, content };
}

function isCollectionRoot(
  frontmatter: Record<string, unknown>,
  filePath: string,
): boolean {
  const notionId =
    typeof frontmatter.notionId === "string" ? frontmatter.notionId : null;
  const notionRootId =
    typeof frontmatter.notionRootId === "string"
      ? frontmatter.notionRootId
      : null;

  if (notionId && notionRootId && notionId === notionRootId) return true;
  if (frontmatter.parent === null || frontmatter.parent === "null") return true;

  const relative = path.relative(CONTENT_DIR, filePath).replace(/\\/g, "/");
  return relative === "index.md";
}

function resolveChildItems(
  parentDir: string,
  parentSlug: string[],
  frontmatter: Record<string, unknown>,
): HomeCollectionItem[] {
  const items: HomeCollectionItem[] = [];

  if (Array.isArray(frontmatter.children) && frontmatter.children.length > 0) {
    for (const childSlug of frontmatter.children) {
      if (typeof childSlug !== "string") continue;

      const childSlugParts = resolveChildSlugParts(childSlug, parentSlug);

      const asFile = path.join(CONTENT_DIR, ...childSlugParts) + ".md";
      const asIndex = path.join(CONTENT_DIR, ...childSlugParts, "index.md");
      const childPath = fs.existsSync(asIndex)
        ? asIndex
        : fs.existsSync(asFile)
          ? asFile
          : null;

      if (!childPath) continue;

      const { frontmatter: childFm, content } = parseMdFile(childPath);
      const title =
        (typeof childFm.title === "string" && childFm.title) ||
        childSlug.replace(/-/g, " ");

      items.push({
        title,
        href: slugToHref(childSlugParts),
        icon: typeof childFm.icon === "string" ? childFm.icon : null,
        order: typeof childFm.order === "number" ? childFm.order : 0,
        estimatedDays:
          typeof childFm.estimatedDays === "string"
            ? childFm.estimatedDays
            : extractEstimatedDays(title),
      });
    }

    return items.sort(
      (a, b) => a.order - b.order || a.title.localeCompare(b.title),
    );
  }

  if (!fs.existsSync(parentDir)) return items;

  for (const entry of fs.readdirSync(parentDir, { withFileTypes: true })) {
    if (entry.name.startsWith("_") || entry.name === "index.md") continue;

    const entryPath = path.join(parentDir, entry.name);

    if (entry.isDirectory()) {
      const indexPath = path.join(entryPath, "index.md");
      if (!fs.existsSync(indexPath)) continue;

      const { frontmatter: childFm } = parseMdFile(indexPath);
      const title =
        (typeof childFm.title === "string" && childFm.title) ||
        entry.name.replace(/-/g, " ");
      items.push({
        title,
        href: slugToHref([...parentSlug, entry.name]),
        icon: typeof childFm.icon === "string" ? childFm.icon : null,
        order: typeof childFm.order === "number" ? childFm.order : 0,
        estimatedDays:
          typeof childFm.estimatedDays === "string"
            ? childFm.estimatedDays
            : extractEstimatedDays(title),
      });
      continue;
    }

    if (!entry.name.endsWith(".md")) continue;

    const { frontmatter: childFm, content: childContent } = parseMdFile(entryPath);
    const title =
      (typeof childFm.title === "string" && childFm.title) ||
      entry.name.replace(/\.md$/, "").replace(/-/g, " ");
    items.push({
      title,
      href: slugToHref([...parentSlug, entry.name.replace(/\.md$/, "")]),
      icon: typeof childFm.icon === "string" ? childFm.icon : null,
      order: typeof childFm.order === "number" ? childFm.order : 0,
      estimatedDays:
        typeof childFm.estimatedDays === "string"
          ? childFm.estimatedDays
          : extractEstimatedDays(title),
    });
  }

  return items.sort(
    (a, b) => a.order - b.order || a.title.localeCompare(b.title),
  );
}

function buildCollectionFromPath(
  filePath: string,
  slug: string[],
): HomeCollection {
  const { frontmatter, content } = parseMdFile(filePath);
  const parentDir = path.dirname(filePath);
  const children = resolveChildItems(parentDir, slug, frontmatter);

  const slugKey = slug.length > 0 ? slug.join("/") : "index";
  const title =
    (typeof frontmatter.title === "string" && frontmatter.title) ||
    slug.join("/") ||
    "Roadmaps";

  return {
    title,
    description: extractDescription(content),
    href: slugToHref(slug),
    slugKey,
    category: inferRoadmapCategory(slugKey, title),
    icon: typeof frontmatter.icon === "string" ? frontmatter.icon : null,
    order: typeof frontmatter.order === "number" ? frontmatter.order : 0,
    childCount: children.length,
    children,
  };
}

export function getHomeContent(): HomeContent {
  if (!fs.existsSync(CONTENT_DIR)) {
    return {
      collections: [],
      standalonePages: [],
      stats: { collectionCount: 0, phaseCount: 0, totalPages: 0 },
    };
  }

  const collections: HomeCollection[] = [];
  const standalonePages: HomePageLink[] = [];
  const collectionRoots = new Set<string>();

  const rootIndex = path.join(CONTENT_DIR, "index.md");
  if (fs.existsSync(rootIndex)) {
    const { frontmatter } = parseMdFile(rootIndex);
    if (isCollectionRoot(frontmatter, rootIndex)) {
      const rootSlug =
        typeof frontmatter.slug === "string" && frontmatter.slug.trim()
          ? frontmatter.slug.split("/").filter(Boolean)
          : [];
      collections.push(buildCollectionFromPath(rootIndex, rootSlug));
      collectionRoots.add("index.md");
      for (const childSlug of Array.isArray(frontmatter.children)
        ? frontmatter.children
        : []) {
        if (typeof childSlug === "string") {
          collectionRoots.add(
            childSlug.includes("/") ? childSlug.split("/")[0] : childSlug,
          );
        }
      }
    }
  }

  for (const entry of fs.readdirSync(CONTENT_DIR, { withFileTypes: true })) {
    if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue;

    const entryPath = path.join(CONTENT_DIR, entry.name);

    if (entry.isDirectory()) {
      const indexPath = path.join(entryPath, "index.md");
      if (!fs.existsSync(indexPath)) continue;

      const { frontmatter } = parseMdFile(indexPath);
      if (!isCollectionRoot(frontmatter, indexPath)) continue;

      collections.push(buildCollectionFromPath(indexPath, [entry.name]));
      collectionRoots.add(entry.name);
      continue;
    }

    if (!entry.name.endsWith(".md") || entry.name === "index.md") continue;

    const { frontmatter, content } = parseMdFile(entryPath);
    const titleFromBody = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
    standalonePages.push({
      title:
        (typeof frontmatter.title === "string" && frontmatter.title) ||
        titleFromBody ||
        entry.name.replace(/\.md$/, "").replace(/-/g, " "),
      href: slugToHref([entry.name.replace(/\.md$/, "")]),
      icon: typeof frontmatter.icon === "string" ? frontmatter.icon : null,
      order: typeof frontmatter.order === "number" ? frontmatter.order : 0,
    });
  }

  collections.sort(
    (a, b) => a.order - b.order || a.title.localeCompare(b.title),
  );
  standalonePages.sort(
    (a, b) => a.order - b.order || a.title.localeCompare(b.title),
  );

  let totalPages = 0;
  let phaseCount = 0;

  try {
    totalPages = getAllSlugs().length;
    phaseCount = collections.reduce((sum, c) => sum + c.childCount, 0);
  } catch {
    totalPages = collections.length + standalonePages.length;
    phaseCount = collections.reduce((sum, c) => sum + c.childCount, 0);
  }

  return {
    collections,
    standalonePages,
    stats: {
      collectionCount: collections.length,
      phaseCount,
      totalPages,
    },
  };
}
