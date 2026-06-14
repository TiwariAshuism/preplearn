import path from "path";
import type { ParsedPage } from "./types";

/** Strip leading emoji / symbol prefix from Notion titles. */
function stripLeadingIcon(title: string): string {
  return title.replace(/^[^\w\s]+\s*/, "").trim();
}

/** Remove trailing "(Days 1–15)" style suffixes. */
function stripDayRange(title: string): string {
  return title.replace(/\s*\(Days\s+\d+[–-]\d+\)\s*$/i, "").trim();
}

/** Short label for sidebar navigation — phases become "Phase 1", "Phase 2", etc. */
export function shortNavTitle(title: string): string {
  const cleaned = stripDayRange(stripLeadingIcon(title));
  const phaseMatch = cleaned.match(/^Phase\s+(\d+)\b/i);

  if (phaseMatch) return `Phase ${phaseMatch[1]}`;

  return cleaned.length > 36 ? `${cleaned.slice(0, 34)}…` : cleaned;
}

/** Skip thin index hubs so breadcrumbs stay shallow (collection root → section → page). */
export function shouldShowInBreadcrumb(
  parsed: ParsedPage,
  segmentIndex: number,
  totalSegments: number,
): boolean {
  const isFirst = segmentIndex === 0;
  const isLast = segmentIndex === totalSegments - 1;

  if (isFirst || isLast) return true;
  if (parsed.frontmatter.hideInBreadcrumb === true) return false;
  if (parsed.frontmatter.hideInBreadcrumb === false) return true;

  if (path.basename(parsed.filePath) !== "index.md") return true;

  const childCount = parsed.frontmatter.children.length;
  if (childCount === 0) return true;

  const body = parsed.content.trim();
  const linkCount = body.match(/\]\([^)]+\)/g)?.length ?? 0;

  // Single-child passthrough hubs (title + one link).
  if (childCount === 1 && body.length < 400) return false;

  // Table-of-contents hubs with mostly links and little prose.
  if (linkCount >= childCount && body.length < 1200) return false;

  return true;
}

/** Slightly longer labels for breadcrumbs — "Phase 1 · Foundations". */
export function shortBreadcrumbTitle(title: string): string {
  const cleaned = stripDayRange(stripLeadingIcon(title));
  const phaseMatch = cleaned.match(/^Phase\s+(\d+)\s*[—–-]\s*(.+)$/i);

  if (phaseMatch) {
    const topic = phaseMatch[2].trim();
    const shortTopic = topic.length > 22 ? `${topic.slice(0, 20)}…` : topic;
    return `Phase ${phaseMatch[1]} · ${shortTopic}`;
  }

  return cleaned.length > 40 ? `${cleaned.slice(0, 38)}…` : cleaned;
}
