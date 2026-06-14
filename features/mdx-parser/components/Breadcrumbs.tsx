import Link from "next/link";
import { shortBreadcrumbTitle } from "../lib/display-title";
import type { Breadcrumb } from "../lib/types";

type BreadcrumbsProps = {
  items: Breadcrumb[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-zinc-500">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const label =
            item.title === "Home" || item.title === "Templates"
              ? item.title
              : shortBreadcrumbTitle(item.title);

          return (
            <li key={item.href} className="flex items-center gap-1.5">
              {index > 0 && <span className="text-zinc-400">/</span>}
              {isLast ? (
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
