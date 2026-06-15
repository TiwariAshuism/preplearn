import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { shouldShowInBreadcrumb } from "./display-title";
import { buildPageContext } from "./page-context";
import {
  getCollectionRootForSlug,
  isCollectionRoot,
} from "./collection";
import { trimCollectionHubBody } from "./hub-content";
import type {
  Breadcrumb,
  NavNode,
  PageContext,
  PageData,
  PageFrontmatter,
  PageLink,
  ParsedPage,
  SectionMeta,
} from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content");
const ROOT_INDEX_PATH = path.join(CONTENT_DIR, "index.md");

function readRootIndexSlug(): string[] | null {
  if (!fs.existsSync(ROOT_INDEX_PATH)) return null;

  const { data } = matter(fs.readFileSync(ROOT_INDEX_PATH, "utf-8"));
  if (typeof data.slug === "string" && data.slug.trim()) {
    return data.slug.split("/").filter(Boolean);
  }

  return null;
}

function assertContentDir(): void {
  if (!fs.existsSync(CONTENT_DIR)) {
    throw new Error(
      'No content/ directory found. Add .md files to content/ or run "bun run fetch-notion".',
    );
  }

  const mdFiles = collectMarkdownFiles(CONTENT_DIR);
  if (mdFiles.length === 0) {
    throw new Error(
      'No .md files in content/. Add .md files to content/ or run "bun run fetch-notion".',
    );
  }
}

function collectMarkdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectMarkdownFiles(fullPath));
    } else if (entry.name.endsWith(".md")) {
      results.push(fullPath);
    }
  }
  return results;
}

function humanizeFolderName(name: string): string {
  return name
    .split(/[-_]/g)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function extractTitleFromBody(body: string): string | null {
  const match = body.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? null;
}

export function getSectionMeta(dirPath: string): SectionMeta | null {
  const metaPath = path.join(dirPath, "_meta.json");
  if (!fs.existsSync(metaPath)) return null;

  try {
    return JSON.parse(fs.readFileSync(metaPath, "utf-8")) as SectionMeta;
  } catch {
    return null;
  }
}

function filePathToSlug(filePath: string): string[] {
  const relative = path.relative(CONTENT_DIR, filePath).replace(/\\/g, "/");
  if (relative === "index.md") {
    return readRootIndexSlug() ?? [];
  }

  if (relative.endsWith("/index.md")) {
    return relative.slice(0, -"/index.md".length).split("/");
  }

  return relative.replace(/\.md$/, "").split("/");
}

export function slugToFilePath(slug: string[]): string | null {
  if (slug.length === 0) return null;

  const rootSlug = readRootIndexSlug();
  if (rootSlug && slug.join("/") === rootSlug.join("/")) {
    return ROOT_INDEX_PATH;
  }

  const asFile = path.join(CONTENT_DIR, ...slug) + ".md";
  if (fs.existsSync(asFile)) return asFile;

  const asIndex = path.join(CONTENT_DIR, ...slug, "index.md");
  if (fs.existsSync(asIndex)) return asIndex;

  return null;
}

/** Resolve a frontmatter child slug to on-disk path segments. */
export function resolveChildSlugParts(
  childSlug: string,
  parentSlug: string[],
): string[] {
  if (childSlug.includes("/")) return childSlug.split("/");

  const candidates = [[childSlug], [...parentSlug, childSlug]];

  for (const parts of candidates) {
    if (parts.length === 0) continue;
    const asFile = path.join(CONTENT_DIR, ...parts) + ".md";
    const asIndex = path.join(CONTENT_DIR, ...parts, "index.md");
    if (fs.existsSync(asFile) || fs.existsSync(asIndex)) return parts;
  }

  return [childSlug];
}

function inferParentSlug(slug: string[]): string | null {
  if (slug.length <= 1) return null;
  return slug.slice(0, -1).join("/");
}

function inferChildSlugs(dirPath: string, currentSlug: string[]): string[] {
  if (!fs.existsSync(dirPath)) return [];

  const childSlugs: string[] = [];

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (entry.name.startsWith("_")) continue;

    if (entry.isDirectory()) {
      const indexPath = path.join(dirPath, entry.name, "index.md");
      if (fs.existsSync(indexPath)) {
        childSlugs.push([...currentSlug, entry.name].join("/"));
      }
      continue;
    }

    if (entry.name.endsWith(".md") && entry.name !== "index.md") {
      childSlugs.push(
        [...currentSlug, entry.name.replace(/\.md$/, "")].join("/"),
      );
    }
  }

  return childSlugs;
}

export function normalizeFrontmatter(
  raw: Record<string, unknown>,
  filePath: string,
  body: string,
): PageFrontmatter {
  const slug = filePathToSlug(filePath);
  const slugKey = slug.join("/");
  const dirPath = path.dirname(filePath);
  const fileName = path.basename(filePath);
  const folderName = path.basename(dirPath);

  const source =
    raw.source === "notion" || raw.notionId ? "notion" : "manual";

  const defaultSlug =
    fileName === "index.md"
      ? folderName === "content"
        ? "index"
        : folderName
      : fileName.replace(/\.md$/, "");

  const title =
    (typeof raw.title === "string" && raw.title) ||
    extractTitleFromBody(body) ||
    humanizeFolderName(defaultSlug);

  const normalizedSlug =
    (typeof raw.slug === "string" && raw.slug) || defaultSlug;

  const parent =
    typeof raw.parent === "string"
      ? raw.parent
      : inferParentSlug(slug.length ? slug : [normalizedSlug]);

  const children = Array.isArray(raw.children)
    ? raw.children.filter((c): c is string => typeof c === "string")
    : inferChildSlugs(dirPath, slug.length ? slug : []);

  const order = typeof raw.order === "number" ? raw.order : 0;

  return {
    source,
    title,
    slug: slugKey || normalizedSlug,
    notionId: typeof raw.notionId === "string" ? raw.notionId : null,
    notionRootId:
      typeof raw.notionRootId === "string" ? raw.notionRootId : null,
    parent: parent ?? null,
    children,
    order,
    icon: typeof raw.icon === "string" ? raw.icon : null,
    cover: typeof raw.cover === "string" ? raw.cover : null,
    hideInBreadcrumb:
      raw.hideInBreadcrumb === true
        ? true
        : raw.hideInBreadcrumb === false
          ? false
          : undefined,
    related: Array.isArray(raw.related)
      ? raw.related.filter((r): r is string => typeof r === "string")
      : undefined,
    checklist: Array.isArray(raw.checklist)
      ? raw.checklist.filter((c): c is string => typeof c === "string")
      : undefined,
    estimatedDays:
      typeof raw.estimatedDays === "string" ? raw.estimatedDays : undefined,
  };
}

function parsePageFile(filePath: string): ParsedPage {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const frontmatter = normalizeFrontmatter(
    data as Record<string, unknown>,
    filePath,
    content,
  );
  const slug = filePathToSlug(filePath);

  return { frontmatter, content, filePath, slug };
}

function sortNavNodes(nodes: NavNode[]): NavNode[] {
  return [...nodes].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.title.localeCompare(b.title);
  });
}

function slugToHref(slug: string[]): string {
  if (slug.length === 0) return "/templates";
  return `/templates/${slug.join("/")}`;
}

function buildNavFromDirectory(
  dirPath: string,
  slugPrefix: string[],
  isTopLevelSection: boolean,
): NavNode | null {
  const sectionMeta = getSectionMeta(dirPath);
  const indexPath = path.join(dirPath, "index.md");
  const folderName = path.basename(dirPath);
  const hasIndex = fs.existsSync(indexPath);

  let title = sectionMeta?.title ?? humanizeFolderName(folderName);
  let icon: string | null = sectionMeta?.icon ?? null;
  let order = sectionMeta?.order ?? 0;
  const slug = [...slugPrefix];

  if (hasIndex) {
    const parsed = parsePageFile(indexPath);
    title = parsed.frontmatter.title;
    icon = parsed.frontmatter.icon ?? icon;
    order = parsed.frontmatter.order ?? order;
  }

  const children: NavNode[] = [];

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (entry.name.startsWith("_")) continue;

    const entryPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      const childNode = buildNavFromDirectory(
        entryPath,
        [...slugPrefix, entry.name],
        false,
      );
      if (childNode) children.push(childNode);
      continue;
    }

    if (!entry.name.endsWith(".md") || entry.name === "index.md") continue;

    const parsed = parsePageFile(entryPath);
    children.push({
      title: parsed.frontmatter.title,
      slug: parsed.slug,
      href: slugToHref(parsed.slug),
      icon: parsed.frontmatter.icon,
      order: parsed.frontmatter.order,
      children: [],
    });
  }

  return {
    title,
    slug,
    href: slugToHref(slug),
    icon,
    order,
    children: sortNavNodes(children),
    isSection: isTopLevelSection,
  };
}

export function getAllSlugs(): string[][] {
  assertContentDir();
  return collectMarkdownFiles(CONTENT_DIR).map(filePathToSlug);
}

function buildNavNodeFromSlugParts(
  slugParts: string[],
  isSection: boolean,
): NavNode | null {
  const filePath = slugToFilePath(slugParts);
  if (!filePath) return null;

  const dirPath = path.dirname(filePath);
  if (path.basename(filePath) === "index.md") {
    return buildNavFromDirectory(dirPath, slugParts, isSection);
  }

  const parsed = parsePageFile(filePath);
  return {
    title: parsed.frontmatter.title,
    slug: slugParts,
    href: slugToHref(slugParts),
    icon: parsed.frontmatter.icon,
    order: parsed.frontmatter.order,
    children: [],
    isSection,
  };
}

function resolvePageLink(slugParts: string[]): PageLink | null {
  const filePath = slugToFilePath(slugParts);
  if (!filePath) return null;

  const parsed = parsePageFile(filePath);
  return {
    title: parsed.frontmatter.title,
    href: slugToHref(parsed.slug),
    icon: parsed.frontmatter.icon,
  };
}

function buildCollectionNavNode(
  indexPath: string,
  slugPrefix: string[],
): NavNode | null {
  const parsed = parsePageFile(indexPath);
  const children: NavNode[] = [];

  if (parsed.frontmatter.children.length > 0) {
    for (const childSlug of parsed.frontmatter.children) {
      const slugParts = resolveChildSlugParts(childSlug, slugPrefix);
      const node = buildNavNodeFromSlugParts(slugParts, false);
      if (node) children.push(node);
    }
  } else {
    const dirPath = path.dirname(indexPath);
    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
      if (entry.name.startsWith("_") || entry.name === "index.md") continue;
      const entryPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const child = buildNavFromDirectory(
          entryPath,
          [...slugPrefix, entry.name],
          false,
        );
        if (child) children.push(child);
      } else if (entry.name.endsWith(".md")) {
        const childParsed = parsePageFile(entryPath);
        children.push({
          title: childParsed.frontmatter.title,
          slug: childParsed.slug,
          href: slugToHref(childParsed.slug),
          icon: childParsed.frontmatter.icon,
          order: childParsed.frontmatter.order,
          children: [],
        });
      }
    }
  }

  return {
    title: parsed.frontmatter.title,
    slug: slugPrefix,
    href: slugToHref(slugPrefix),
    icon: parsed.frontmatter.icon,
    order: parsed.frontmatter.order,
    children: sortNavNodes(children),
    isSection: true,
  };
}

function getCollectionNavForSlug(slug: string[]): NavNode | null {
  const root = getCollectionRootForSlug(slug);
  if (!root) return null;

  const indexPath = slugToFilePath(root.slug);
  if (!indexPath) return null;

  return buildCollectionNavNode(indexPath, root.slug);
}

export function getPageBySlug(slug: string[]): PageData | null {
  assertContentDir();

  const filePath = slugToFilePath(slug);
  if (!filePath) return null;

  const parsed = parsePageFile(filePath);
  const childNodes: NavNode[] = [];

  if (parsed.frontmatter.children.length > 0) {
    for (const childSlug of parsed.frontmatter.children) {
      const childSlugParts = resolveChildSlugParts(childSlug, parsed.slug);

      const childPath = slugToFilePath(childSlugParts);
      if (!childPath) continue;

      const childParsed = parsePageFile(childPath);
      childNodes.push({
        title: childParsed.frontmatter.title,
        slug: childParsed.slug,
        href: slugToHref(childParsed.slug),
        icon: childParsed.frontmatter.icon,
        order: childParsed.frontmatter.order,
        children: [],
      });
    }
  } else {
    const dirPath = path.dirname(filePath);
    const isIndex = path.basename(filePath) === "index.md";
    const navDir = isIndex ? dirPath : dirPath;

    for (const entry of fs.readdirSync(navDir, { withFileTypes: true })) {
      if (entry.name.startsWith("_")) continue;

      const entryPath = path.join(navDir, entry.name);

      if (entry.isDirectory()) {
        const childNode = buildNavFromDirectory(
          entryPath,
          [...parsed.slug, entry.name],
          false,
        );
        if (childNode) childNodes.push(childNode);
        continue;
      }

      if (entryPath === filePath) continue;
      if (!entry.name.endsWith(".md") || entry.name === "index.md") continue;

      const childParsed = parsePageFile(entryPath);
      childNodes.push({
        title: childParsed.frontmatter.title,
        slug: childParsed.slug,
        href: slugToHref(childParsed.slug),
        icon: childParsed.frontmatter.icon,
        order: childParsed.frontmatter.order,
        children: [],
      });
    }
  }

  const breadcrumbs: Breadcrumb[] = [{ title: "Home", href: "/" }];

  if (parsed.slug.length > 0) {
    breadcrumbs.push({ title: "Templates", href: "/templates" });

    const collectionRoot = getCollectionRootForSlug(parsed.slug);
    if (
      collectionRoot &&
      collectionRoot.childSlugs.includes(parsed.slug[0]) &&
      !collectionRoot.slug.includes(parsed.slug[0])
    ) {
      breadcrumbs.push({
        title: collectionRoot.title,
        href: collectionRoot.href,
      });
    }

    for (let i = 0; i < parsed.slug.length; i++) {
      const segmentSlug = parsed.slug.slice(0, i + 1);
      const segmentPath = slugToFilePath(segmentSlug);
      if (!segmentPath) continue;

      const segmentParsed = parsePageFile(segmentPath);
      if (
        !shouldShowInBreadcrumb(segmentParsed, i, parsed.slug.length)
      ) {
        continue;
      }

      breadcrumbs.push({
        title: segmentParsed.frontmatter.title,
        href: slugToHref(segmentSlug),
      });
    }
  }

  const collectionRoot = getCollectionRootForSlug(parsed.slug);
  const collectionNav = getCollectionNavForSlug(parsed.slug);

  const isCollectionHub =
    path.basename(filePath) === "index.md" &&
    isCollectionRoot(parsed, filePath) &&
    parsed.frontmatter.children.length > 0;
  const displayContent = isCollectionHub
    ? trimCollectionHubBody(parsed.content, parsed.frontmatter.children)
    : parsed.content;

  const pageContext: PageContext = buildPageContext(
    parsed.frontmatter,
    displayContent,
    parsed.slug,
    collectionRoot?.slug ?? (parsed.slug.length > 0 ? [parsed.slug[0]] : []),
    collectionRoot?.title ?? parsed.frontmatter.title,
    collectionNav ? [collectionNav] : childNodes,
    resolvePageLink,
  );

  return {
    frontmatter: parsed.frontmatter,
    content: displayContent,
    children: sortNavNodes(childNodes),
    breadcrumbs,
    slug: parsed.slug,
    pageContext,
  };
}

export function getNavTree(): NavNode[] {
  assertContentDir();

  const nodes: NavNode[] = [];
  const claimedTopLevelSlugs = new Set<string>();

  if (fs.existsSync(ROOT_INDEX_PATH)) {
    const parsed = parsePageFile(ROOT_INDEX_PATH);
    if (isCollectionRoot(parsed, ROOT_INDEX_PATH)) {
      const node = buildCollectionNavNode(ROOT_INDEX_PATH, parsed.slug);
      if (node) {
        nodes.push(node);
        for (const childSlug of parsed.frontmatter.children) {
          const key = childSlug.includes("/")
            ? childSlug.split("/")[0]
            : childSlug;
          claimedTopLevelSlugs.add(key);
        }
      }
    }
  }

  for (const entry of fs.readdirSync(CONTENT_DIR, { withFileTypes: true })) {
    if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue;
    if (entry.name === "index.md") continue;

    if (!entry.isDirectory()) continue;

    const indexPath = path.join(CONTENT_DIR, entry.name, "index.md");
    if (!fs.existsSync(indexPath)) continue;

    const parsed = parsePageFile(indexPath);
    if (!isCollectionRoot(parsed, indexPath)) continue;

    const node = buildCollectionNavNode(indexPath, [entry.name]);
    if (!node) continue;

    nodes.push(node);
    claimedTopLevelSlugs.add(entry.name);

    for (const childSlug of parsed.frontmatter.children) {
      const key = childSlug.includes("/") ? childSlug.split("/")[0] : childSlug;
      claimedTopLevelSlugs.add(key);
    }
  }

  for (const entry of fs.readdirSync(CONTENT_DIR, { withFileTypes: true })) {
    if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue;
    if (!entry.name.endsWith(".md") || entry.name === "index.md") continue;

    const slugKey = entry.name.replace(/\.md$/, "");
    if (claimedTopLevelSlugs.has(slugKey)) continue;

    const entryPath = path.join(CONTENT_DIR, entry.name);
    const parsed = parsePageFile(entryPath);
    nodes.push({
      title: parsed.frontmatter.title,
      slug: parsed.slug,
      href: slugToHref(parsed.slug),
      icon: parsed.frontmatter.icon,
      order: parsed.frontmatter.order,
      children: [],
      isSection: true,
    });
  }

  return sortNavNodes(nodes);
}
