import type { NavNode } from "./types";

function slugToHref(slug: string[]): string {
  if (slug.length === 0) return "/templates";
  return `/templates/${slug.join("/")}`;
}

function normalizeRelativeTarget(url: string): string {
  return url.replace(/^\.\//, "").replace(/\.md$/, "").trim();
}

function findChildForLinkText(
  linkText: string,
  children: NavNode[],
): NavNode | undefined {
  const cleaned = linkText.replace(/^[^\w\s]+\s*/, "").trim();

  const phaseMatch = cleaned.match(/Phase\s+(\d+)\b/i);
  if (phaseMatch) {
    const phaseNum = phaseMatch[1];
    return children.find(
      (child) =>
        new RegExp(`\\bPhase\\s+${phaseNum}\\b`, "i").test(child.title) ||
        child.slug.some((segment) =>
          segment.match(new RegExp(`phase-${phaseNum}(?:[^0-9]|$)`, "i")),
        ),
    );
  }

  const lower = cleaned.toLowerCase();
  return children.find((child) => {
    const childTitle = child.title
      .replace(/^[^\w\s]+\s*/, "")
      .trim()
      .toLowerCase();
    return (
      childTitle.includes(lower) ||
      lower.includes(childTitle.slice(0, Math.min(childTitle.length, 20)))
    );
  });
}

function findChildByRelativeTarget(
  target: string,
  children: NavNode[],
): NavNode | undefined {
  const normalized = normalizeRelativeTarget(target);

  return children.find((child) => {
    const lastSegment = child.slug[child.slug.length - 1];
    if (lastSegment === normalized) return true;
    if (child.href === slugToHref([...child.slug.slice(0, -1), normalized]))
      return true;
    if (child.href.endsWith(`/${normalized}`)) return true;
    return child.slug.join("/") === normalized || child.slug.join("/").endsWith(`/${normalized}`);
  });
}

/** Fix Notion `#` links and resolve relative folder/file links to /templates paths. */
export function rewriteInternalLinks(
  markdown: string,
  children: NavNode[],
  currentSlug: string[] = [],
): string {
  return markdown.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    (full, text, url) => {
      const trimmedUrl = url.trim();

      if (
        trimmedUrl.startsWith("http") ||
        trimmedUrl.startsWith("mailto:") ||
        trimmedUrl.startsWith("/templates/")
      ) {
        return full;
      }

      if (trimmedUrl === "#" || trimmedUrl.includes("notion.so")) {
        if (children.length === 0) return full;
        const child = findChildForLinkText(text, children);
        if (!child) return full;
        return `[${text}](${child.href})`;
      }

      if (trimmedUrl.startsWith("#")) return full;

      // Relative link: 01-go-build-toolchain, ./page.md, sub/page
      const target = normalizeRelativeTarget(trimmedUrl);
      if (!target) return full;

      const child = findChildByRelativeTarget(target, children);
      if (child) {
        return `[${text}](${child.href})`;
      }

      const href = slugToHref([
        ...currentSlug,
        ...target.split("/").filter(Boolean),
      ]);
      return `[${text}](${href})`;
    },
  );
}
