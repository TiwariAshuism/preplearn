import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import matter from "gray-matter";
import fs from "fs";
import path from "path";
import slugify from "slugify";

import { upsertSyncRoot } from "../features/mdx-parser/lib/sync-meta";
import { trimCollectionHubBody } from "../features/mdx-parser/lib/hub-content";

const CONTENT_DIR = path.join(process.cwd(), "content");
const RATE_LIMIT_MS = 333;

function loadEnvFile(relativePath: string): void {
  const envPath = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

type NotionPageNode = {
  id: string;
  title: string;
  slug: string;
  icon: string | null;
  cover: string | null;
  parentSlug: string | null;
  parentId: string | null;
  children: NotionPageNode[];
  order: number;
  markdown: string;
};

type PageMeta = {
  id: string;
  title: string;
  icon: string | null;
  cover: string | null;
  parentId: string | null;
  order: number;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeId(id: string): string {
  return id.replace(/-/g, "");
}

function toSlug(title: string): string {
  return slugify(title, { lower: true, strict: true });
}

function getPageTitle(
  page: Awaited<ReturnType<Client["pages"]["retrieve"]>>,
): string {
  if (!("properties" in page)) return "Untitled";

  for (const prop of Object.values(page.properties)) {
    if (prop.type === "title" && prop.title.length > 0) {
      return prop.title.map((t) => t.plain_text).join("") || "Untitled";
    }
  }

  return "Untitled";
}

function getPageIcon(
  page: Awaited<ReturnType<Client["pages"]["retrieve"]>>,
): string | null {
  if (!("icon" in page) || !page.icon) return null;
  if (page.icon.type === "emoji") return page.icon.emoji;
  return null;
}

function getPageCover(
  page: Awaited<ReturnType<Client["pages"]["retrieve"]>>,
): string | null {
  if (!("cover" in page) || !page.cover) return null;
  if (page.cover.type === "external") return page.cover.external.url;
  if (page.cover.type === "file") return page.cover.file.url;
  return null;
}

function isNotionSourcedFile(filePath: string): boolean {
  if (!fs.existsSync(filePath)) return false;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data } = matter(raw);
  return data.source === "notion" || Boolean(data.notionId);
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

function getFileNotionRootId(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null;

  const { data } = matter(fs.readFileSync(filePath, "utf-8"));
  return typeof data.notionRootId === "string" ? data.notionRootId : null;
}

function removeNotionFilesForRoot(rootPageId: string): number {
  if (!fs.existsSync(CONTENT_DIR)) return 0;

  const rootNorm = normalizeId(rootPageId);
  let removed = 0;

  for (const filePath of collectMarkdownFiles(CONTENT_DIR)) {
    if (!isNotionSourcedFile(filePath)) continue;

    const raw = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(raw);
    const fileRootId =
      typeof data.notionRootId === "string" ? data.notionRootId : null;

    // Only remove files synced from this root — preserves other Notion trees.
    if (fileRootId && normalizeId(fileRootId) === rootNorm) {
      fs.unlinkSync(filePath);
      removed++;
    }
  }

  removeEmptyDirs(CONTENT_DIR);
  return removed;
}

function removeEmptyDirs(dir: string): void {
  if (!fs.existsSync(dir)) return;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      removeEmptyDirs(path.join(dir, entry.name));
    }
  }

  if (dir === CONTENT_DIR) return;

  if (fs.readdirSync(dir).length === 0) {
    fs.rmdirSync(dir);
  }
}

function manualFileExists(relativePath: string): boolean {
  const fullPath = path.join(CONTENT_DIR, relativePath);
  return fs.existsSync(fullPath) && !isNotionSourcedFile(fullPath);
}

function buildFrontmatter(node: NotionPageNode, notionRootId: string): string {
  const lines = [
    "---",
    "source: notion",
    `title: ${JSON.stringify(node.title)}`,
    `slug: ${JSON.stringify(node.slug)}`,
    `notionId: ${JSON.stringify(node.id)}`,
    `notionRootId: ${JSON.stringify(notionRootId)}`,
    `parent: ${node.parentSlug ? JSON.stringify(node.parentSlug) : "null"}`,
    `children: ${JSON.stringify(node.children.map((c) => c.slug))}`,
    `order: ${node.order}`,
    `icon: ${node.icon ? JSON.stringify(node.icon) : "null"}`,
    `cover: ${node.cover ? JSON.stringify(node.cover) : "null"}`,
    "---",
    "",
  ];
  return lines.join("\n");
}

/** Always write as folder/index.md so navigation gets proper sections. */
function writePageTree(
  node: NotionPageNode,
  parentDir: string,
  notionRootId: string,
): number {
  const relativeDir = path.join(parentDir, node.slug).replace(/\\/g, "/");
  const relativePath = path.join(relativeDir, "index.md").replace(/\\/g, "/");

  if (manualFileExists(relativePath)) {
    console.warn(
      `Skipping Notion page "${node.title}" — manual file exists at content/${relativePath}`,
    );
    return 0;
  }

  const fullPath = path.join(CONTENT_DIR, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  const childSlugs = node.children.map((c) => c.slug);
  const markdown =
    childSlugs.length > 0
      ? trimCollectionHubBody(node.markdown, childSlugs)
      : node.markdown;

  fs.writeFileSync(
    fullPath,
    buildFrontmatter(node, notionRootId) + markdown,
  );

  let written = 1;
  for (const child of node.children) {
    written += writePageTree(child, relativeDir, notionRootId);
  }

  return written;
}

function writeNotionRoot(rootNode: NotionPageNode, rootPageId: string): number {
  let written = 0;
  const rootIndexPath = path.join(CONTENT_DIR, "index.md");

  if (rootNode.children.length === 0) {
    return writePageTree(rootNode, "", rootPageId);
  }

  const indexIsManual = manualFileExists("index.md");
  const existingRootId = indexIsManual ? null : getFileNotionRootId(rootIndexPath);
  const canUseContentIndex =
    !indexIsManual &&
    (!existingRootId || normalizeId(existingRootId) === normalizeId(rootPageId));

  if (canUseContentIndex) {
    const childSlugs = rootNode.children.map((c) => c.slug);
    const markdown =
      childSlugs.length > 0
        ? trimCollectionHubBody(rootNode.markdown, childSlugs)
        : rootNode.markdown;

    fs.writeFileSync(
      rootIndexPath,
      buildFrontmatter(rootNode, rootPageId) + markdown,
    );
    written++;

    for (const child of rootNode.children) {
      written += writePageTree(child, "", rootPageId);
    }

    return written;
  }

  if (indexIsManual) {
    console.warn(
      "Manual content/index.md exists — writing Notion root under content/" +
        `${rootNode.slug}/index.md instead`,
    );
  } else if (existingRootId) {
    console.log(
      `Another Notion root owns content/index.md — writing under content/${rootNode.slug}/`,
    );
  }

  return writePageTree(rootNode, "", rootPageId);
}

async function fetchAllPageMeta(notion: Client): Promise<Map<string, PageMeta>> {
  const pages = new Map<string, PageMeta>();
  let cursor: string | undefined;
  let order = 0;

  do {
    await sleep(RATE_LIMIT_MS);
    const response = await notion.search({
      filter: { property: "object", value: "page" },
      start_cursor: cursor,
      page_size: 100,
    });

    for (const result of response.results) {
      if (result.object !== "page" || !("properties" in result) || !("parent" in result)) {
        continue;
      }

      let parentId: string | null = null;
      if (result.parent.type === "page_id") {
        parentId = result.parent.page_id;
      } else if (result.parent.type === "block_id") {
        parentId = result.parent.block_id;
      }

      pages.set(normalizeId(result.id), {
        id: result.id,
        title: getPageTitle(result),
        icon: getPageIcon(result),
        cover: getPageCover(result),
        parentId,
        order: order++,
      });
    }

    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return pages;
}

async function fetchChildPageIdsFromBlocks(
  notion: Client,
  blockId: string,
): Promise<{ id: string; order: number }[]> {
  await sleep(RATE_LIMIT_MS);

  const childPages: { id: string; order: number }[] = [];
  let cursor: string | undefined;

  do {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
    });

    for (const block of response.results) {
      if ("type" in block && block.type === "child_page" && "id" in block) {
        childPages.push({ id: block.id, order: childPages.length });
      }
    }

    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
    if (cursor) await sleep(RATE_LIMIT_MS);
  } while (cursor);

  return childPages;
}

function isUnderRoot(
  pageId: string,
  rootId: string,
  allPages: Map<string, PageMeta>,
): boolean {
  if (normalizeId(pageId) === normalizeId(rootId)) return true;

  let current = allPages.get(normalizeId(pageId));
  const visited = new Set<string>();

  while (current?.parentId) {
    const parentNorm = normalizeId(current.parentId);
    if (visited.has(parentNorm)) break;
    visited.add(parentNorm);

    if (parentNorm === normalizeId(rootId)) return true;

    current = allPages.get(parentNorm);
  }

  return false;
}

function getChildIds(
  pageId: string,
  allPages: Map<string, PageMeta>,
  blockChildIds: string[],
): string[] {
  const pageNorm = normalizeId(pageId);
  const childIds = new Map<string, number>();

  for (const meta of allPages.values()) {
    if (!meta.parentId) continue;
    if (normalizeId(meta.parentId) !== pageNorm) continue;
    childIds.set(meta.id, meta.order);
  }

  for (const [index, id] of blockChildIds.entries()) {
    if (!childIds.has(id)) {
      childIds.set(id, 1000 + index);
    }
  }

  return [...childIds.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([id]) => id);
}

async function buildPageTree(
  notion: Client,
  n2m: NotionToMarkdown,
  pageId: string,
  allPages: Map<string, PageMeta>,
  blockChildrenByPage: Map<string, string[]>,
  parentSlug: string | null,
  usedSlugs: Set<string>,
): Promise<NotionPageNode> {
  const meta = allPages.get(normalizeId(pageId));

  await sleep(RATE_LIMIT_MS);
  const page = await notion.pages.retrieve({ page_id: pageId });

  const title = meta?.title ?? getPageTitle(page);
  let slug = toSlug(title);
  if (usedSlugs.has(slug)) {
    slug = `${slug}-${pageId.replace(/-/g, "").slice(0, 8)}`;
  }
  usedSlugs.add(slug);

  await sleep(RATE_LIMIT_MS);
  const mdBlocks = await n2m.pageToMarkdown(pageId);
  const mdString = n2m.toMarkdownString(mdBlocks);
  const markdown = mdString.parent ?? "";

  const blockChildIds = blockChildrenByPage.get(normalizeId(pageId)) ?? [];
  const childIds = getChildIds(pageId, allPages, blockChildIds);
  const children: NotionPageNode[] = [];

  for (const [index, childId] of childIds.entries()) {
    const childParentSlug = parentSlug ? `${parentSlug}/${slug}` : slug;
    const childNode = await buildPageTree(
      notion,
      n2m,
      childId,
      allPages,
      blockChildrenByPage,
      childParentSlug,
      usedSlugs,
    );
    childNode.order = index;
    children.push(childNode);
  }

  children.sort((a, b) => a.order - b.order);

  return {
    id: pageId,
    title,
    slug,
    icon: meta?.icon ?? getPageIcon(page),
    cover: meta?.cover ?? getPageCover(page),
    parentSlug,
    parentId: meta?.parentId ?? null,
    children,
    order: meta?.order ?? 0,
    markdown,
  };
}

async function main() {
  if (process.env.SKIP_NOTION_FETCH === "1") {
    console.log("Skipping Notion fetch (SKIP_NOTION_FETCH=1)");
    process.exit(0);
  }

  const apiKey = process.env.NOTION_API_KEY;
  const rootPageId = process.env.NOTION_ROOT_PAGE_ID;

  if (!apiKey || !rootPageId) {
    console.log("Skipping Notion fetch (NOTION_API_KEY or NOTION_ROOT_PAGE_ID not set)");
    process.exit(0);
  }

  const notion = new Client({ auth: apiKey });
  const n2m = new NotionToMarkdown({ notionClient: notion });

  fs.mkdirSync(CONTENT_DIR, { recursive: true });

  const removed = removeNotionFilesForRoot(rootPageId);
  console.log(
    `Removed ${removed} Notion file(s) for root ${rootPageId.slice(0, 8)}…`,
  );

  console.log("Discovering pages in Notion workspace...");
  const allPages = await fetchAllPageMeta(notion);

  const blockChildrenByPage = new Map<string, string[]>();
  const pagesToScan = [
    rootPageId,
    ...[...allPages.values()]
      .filter((p) => isUnderRoot(p.id, rootPageId, allPages))
      .map((p) => p.id),
  ];

  for (const pageId of pagesToScan) {
    const blockChildren = await fetchChildPageIdsFromBlocks(notion, pageId);
    if (blockChildren.length > 0) {
      blockChildrenByPage.set(
        normalizeId(pageId),
        blockChildren.map((c) => c.id),
      );
    }
  }

  const usedSlugs = new Set<string>();
  const rootNode = await buildPageTree(
    notion,
    n2m,
    rootPageId,
    allPages,
    blockChildrenByPage,
    null,
    usedSlugs,
  );

  let written = writeNotionRoot(rootNode, rootPageId);

  const manualCount = collectMarkdownFiles(CONTENT_DIR).filter(
    (f) => !isNotionSourcedFile(f),
  ).length;

  upsertSyncRoot({
    id: normalizeId(rootPageId),
    title: rootNode.title,
    slug: rootNode.slug,
    pageCount: written,
    syncedAt: new Date().toISOString(),
  });

  console.log(
    `Fetched Notion pages, wrote ${written} file(s) (${manualCount} manual file(s) preserved)`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
