import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getAllSlugs, slugToFilePath } from "../features/mdx-parser/lib/content";

function stripCodeSegments(markdown: string): string {
  return markdown
    .split(/(```[\s\S]*?```)/g)
    .map((segment) => {
      if (segment.startsWith("```")) return "";
      return segment.replace(/`[^`\n]*`/g, "");
    })
    .join("");
}

function collectInternalLinks(markdown: string): string[] {
  const prose = stripCodeSegments(markdown);
  const links: string[] = [];
  const re = /\[[^\]]*\]\(([^)]+)\)/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(prose)) !== null) {
    links.push(m[1].trim());
  }

  return links;
}

/** Ignore Go generics / types that look like [T](args) but aren't doc links. */
function looksLikeDocHref(href: string): boolean {
  if (!href || href.startsWith("http") || href.startsWith("mailto:")) return false;
  if (href.startsWith("#")) return true;

  if (/[\s*[\]()]/.test(href)) return false;
  if (/\bfunc\b/.test(href)) return false;

  if (href.endsWith(".md")) return true;
  if (href.startsWith("templates/")) return true;
  if (href.startsWith("./") || href.startsWith("../")) return true;

  if (!/^[a-zA-Z0-9][a-zA-Z0-9_/-]*$/.test(href)) return false;

  // Skip tiny bare tokens (e.g. Go `Err[T](err)` false positives in prose edge cases)
  if (href.length <= 3 && !href.includes("/")) return false;

  return true;
}

function resolveLink(href: string, currentSlug: string[]): string[] | null {
  if (!href || href.startsWith("http") || href.startsWith("#")) return null;
  if (!looksLikeDocHref(href)) return null;

  const cleaned = href.replace(/^\.\//, "").replace(/^\//, "");

  if (cleaned.startsWith("templates/")) {
    return cleaned.slice("templates/".length).split("/");
  }

  const withoutExt = cleaned.replace(/\.md$/, "");
  const parts = withoutExt.split("/");

  if (parts.length === 1) {
    const filePath = slugToFilePath(currentSlug);
    const isIndex = filePath && path.basename(filePath) === "index.md";
    if (isIndex) {
      return [...currentSlug, parts[0]];
    }
    if (currentSlug.length > 0) {
      return [...currentSlug.slice(0, -1), parts[0]];
    }
    return [parts[0]];
  }

  return parts;
}

function main() {
  const broken: { page: string; href: string }[] = [];

  for (const slug of getAllSlugs()) {
    const filePath = slugToFilePath(slug);
    if (!filePath) continue;

    const { content } = matter(fs.readFileSync(filePath, "utf-8"));
    const pageKey = slug.join("/") || "(root)";

    for (const href of collectInternalLinks(content)) {
      if (!looksLikeDocHref(href)) continue;

      const target = resolveLink(href, slug);
      if (!target) continue;
      if (!slugToFilePath(target)) {
        broken.push({ page: pageKey, href });
      }
    }
  }

  if (broken.length > 0) {
    console.warn(`Found ${broken.length} broken internal link(s):`);
    for (const b of broken.slice(0, 15)) {
      console.warn(`  ${b.page} → ${b.href}`);
    }
    if (broken.length > 15) {
      console.warn(`  … and ${broken.length - 15} more`);
    }
    if (process.env.CHECK_LINKS_STRICT === "1") {
      process.exit(1);
    }
  } else {
    console.log("All internal links OK");
  }
}

main();
