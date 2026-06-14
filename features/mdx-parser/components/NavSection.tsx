"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { shortNavTitle } from "../lib/display-title";
import type { NavNode } from "../lib/types";

type NavSectionProps = {
  node: NavNode;
  depth?: number;
};

function NavLink({
  node,
  depth,
  isActive,
}: {
  node: NavNode;
  depth: number;
  isActive: boolean;
}) {
  return (
    <Link
      href={node.href}
      className={`block rounded-md px-2 py-1.5 text-sm transition-colors break-words ${
        isActive
          ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
      }`}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
    >
      {node.icon ? `${node.icon} ` : ""}
      {shortNavTitle(node.title)}
    </Link>
  );
}

export function NavSection({ node, depth = 0 }: NavSectionProps) {
  const pathname = usePathname();
  const isActive =
    pathname === node.href || pathname.startsWith(`${node.href}/`);
  const hasChildren = node.children.length > 0;

  if (!hasChildren) {
    return <NavLink node={node} depth={depth} isActive={isActive} />;
  }

  return (
    <details open={isActive} className="group">
      <summary
        className={`flex cursor-pointer list-none items-center gap-1 rounded-md px-2 py-1.5 text-sm marker:content-none ${
          node.isSection
            ? "font-semibold text-zinc-900 dark:text-zinc-100"
            : "font-medium text-zinc-700 dark:text-zinc-300"
        } ${isActive ? "text-zinc-900 dark:text-zinc-50" : ""}`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <span className="text-zinc-400 transition-transform group-open:rotate-90">
          ▸
        </span>
        {node.icon ? `${node.icon} ` : ""}
        <Link
          href={node.href}
          onClick={(e) => e.stopPropagation()}
          className="hover:underline"
        >
          {shortNavTitle(node.title)}
        </Link>
      </summary>
      <div className="mt-0.5 space-y-0.5 border-l border-zinc-200 pl-1 dark:border-zinc-800">
        {node.children.map((child) => (
          <NavSection key={child.href} node={child} depth={depth + 1} />
        ))}
      </div>
    </details>
  );
}
