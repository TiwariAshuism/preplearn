"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { findActiveCollectionNode } from "../lib/collection-client";
import type { NavNode } from "../lib/types";
import { NavSection } from "./NavSection";

type NavTreeProps = {
  tree: NavNode[];
};

export function NavTree({ tree }: NavTreeProps) {
  const pathname = usePathname();
  const activeCollection = findActiveCollectionNode(tree, pathname);
  const visibleTree = activeCollection ? [activeCollection] : tree;

  return (
    <nav aria-label="Templates navigation" className="space-y-1">
      <Link
        href="/"
        className="mb-3 block text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        ← All roadmaps
      </Link>
      {visibleTree.map((node) => (
        <NavSection key={node.href} node={node} />
      ))}
    </nav>
  );
}
