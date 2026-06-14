import type { NavNode } from "./types";

/** Pick the sidebar section that matches the current URL. Client-safe (no fs). */
export function findActiveCollectionNode(
  tree: NavNode[],
  pathname: string,
): NavNode | null {
  if (pathname === "/templates") return null;

  const nestedMatches = tree
    .filter(
      (node) =>
        pathname === node.href || pathname.startsWith(`${node.href}/`),
    )
    .sort((a, b) => b.href.length - a.href.length);

  if (nestedMatches.length > 0) return nestedMatches[0];

  const rest = pathname.replace(/^\/templates\/?/, "");
  const firstSegment = rest.split("/")[0];
  if (!firstSegment) return null;

  for (const node of tree) {
    const matchesChild = node.children.some(
      (child) =>
        child.slug[0] === firstSegment ||
        child.href === `/templates/${firstSegment}`,
    );
    if (matchesChild) return node;
  }

  return null;
}
