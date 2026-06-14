import readingTime from "reading-time";
import type { NavNode, PageContext, PageFrontmatter, PageLink } from "./types";

export type TocHeading = {
  id: string;
  text: string;
  level: 2 | 3;
};

function slugToHeadingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function extractToc(markdown: string): TocHeading[] {
  const headings: TocHeading[] = [];

  for (const line of markdown.split("\n")) {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (!match) continue;

    const level = match[1].length as 2 | 3;
    const text = match[2].replace(/\*\*/g, "").replace(/`/g, "").trim();
    if (!text) continue;

    headings.push({ id: slugToHeadingId(text), text, level });
  }

  return headings;
}

export function extractEstimatedDays(title: string): string | null {
  const range = title.match(/Days?\s+(\d+[–-]\d+)/i);
  if (range) return range[1].replace(/-/g, "–");
  const single = title.match(/Days?\s+(\d+)/i);
  return single?.[1] ?? null;
}

function flattenNavLinks(nodes: NavNode[]): PageLink[] {
  const links: PageLink[] = [];

  for (const node of nodes) {
    links.push({
      title: node.title,
      href: node.href,
      icon: node.icon ?? null,
    });
    if (node.children.length > 0) {
      links.push(...flattenNavLinks(node.children));
    }
  }

  return links;
}

function resolveRelatedSlugs(
  frontmatter: PageFrontmatter,
  slug: string[],
): string[] {
  if (Array.isArray(frontmatter.related) && frontmatter.related.length > 0) {
    return frontmatter.related.filter((s): s is string => typeof s === "string");
  }
  return [];
}

export function buildPageContext(
  frontmatter: PageFrontmatter,
  content: string,
  slug: string[],
  collectionSlug: string[],
  collectionTitle: string,
  collectionNav: NavNode[],
  resolveSlug: (parts: string[]) => PageLink | null,
): PageContext {
  const flatLinks = flattenNavLinks(collectionNav);
  const currentHref =
    slug.length === 0 ? "/templates" : `/templates/${slug.join("/")}`;
  const currentIndex = flatLinks.findIndex((l) => l.href === currentHref);

  const relatedSlugs = resolveRelatedSlugs(frontmatter, slug);
  const relatedFromFrontmatter = relatedSlugs
    .map((s) => {
      const parts = s.includes("/") ? s.split("/") : [...collectionSlug, s];
      return resolveSlug(parts);
    })
    .filter((l): l is PageLink => l !== null);

  const siblingRelated = flatLinks
    .filter((l) => l.href !== currentHref)
    .slice(0, 3);

  const checklist = Array.isArray(frontmatter.checklist)
    ? frontmatter.checklist.filter((c): c is string => typeof c === "string")
    : [];

  return {
    readingMinutes: Math.max(1, Math.ceil(readingTime(content).minutes)),
    estimatedDays:
      typeof frontmatter.estimatedDays === "string"
        ? frontmatter.estimatedDays
        : extractEstimatedDays(frontmatter.title),
    toc: extractToc(content),
    prev: currentIndex > 0 ? flatLinks[currentIndex - 1] : null,
    next:
      currentIndex >= 0 && currentIndex < flatLinks.length - 1
        ? flatLinks[currentIndex + 1]
        : null,
    related:
      relatedFromFrontmatter.length > 0
        ? relatedFromFrontmatter
        : siblingRelated,
    checklist,
    collectionSlug,
    collectionTitle,
    phaseLinks: collectionNav[0]?.children.map((c) => ({
      title: c.title,
      href: c.href,
      icon: c.icon ?? null,
    })) ?? [],
  };
}
