import Link from "next/link";
import type { PageLink } from "../lib/types";

export function TableOfContents({
  headings,
}: {
  headings: { id: string; text: string; level: 2 | 3 }[];
}) {
  if (headings.length < 3) return null;

  return (
    <nav
      aria-label="On this page"
      className="mb-8 rounded-lg border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/40 lg:hidden"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        On this page
      </p>
      <ul className="mt-2 space-y-1 text-sm">
        {headings.map((h) => (
          <li key={h.id} style={{ paddingLeft: h.level === 3 ? "0.75rem" : 0 }}>
            <a
              href={`#${h.id}`}
              className="text-zinc-600 hover:text-emerald-700 dark:text-zinc-400 dark:hover:text-emerald-400"
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function DocSidebarToc({
  headings,
}: {
  headings: { id: string; text: string; level: 2 | 3 }[];
}) {
  if (headings.length < 3) return null;

  return (
    <nav
      aria-label="Table of contents"
      className="hidden xl:block"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        On this page
      </p>
      <ul className="mt-3 space-y-1.5 border-l border-zinc-200 pl-3 text-sm dark:border-zinc-800">
        {headings.map((h) => (
          <li key={h.id} style={{ paddingLeft: h.level === 3 ? "0.5rem" : 0 }}>
            <a
              href={`#${h.id}`}
              className="text-zinc-600 hover:text-emerald-700 dark:text-zinc-400 dark:hover:text-emerald-400"
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function PrevNextNav({
  prev,
  next,
}: {
  prev: PageLink | null;
  next: PageLink | null;
}) {
  if (!prev && !next) return null;

  return (
    <nav
      aria-label="Previous and next"
      className="mt-10 grid gap-3 border-t border-zinc-200 pt-8 dark:border-zinc-800 sm:grid-cols-2"
    >
      {prev ? (
        <Link
          href={prev.href}
          className="rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
        >
          <span className="text-xs text-zinc-500">Previous</span>
          <span className="mt-1 block text-sm font-medium text-balance text-zinc-900 dark:text-zinc-100">
            {prev.title}
          </span>
        </Link>
      ) : (
        <div className="hidden sm:block" />
      )}
      {next ? (
        <Link
          href={next.href}
          className={`rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 sm:text-right ${!prev ? "sm:col-start-2" : ""} dark:border-zinc-800 dark:hover:bg-zinc-900`}
        >
          <span className="text-xs text-zinc-500">Next</span>
          <span className="mt-1 block text-sm font-medium text-balance text-zinc-900 dark:text-zinc-100">
            {next.title}
          </span>
        </Link>
      ) : null}
    </nav>
  );
}

export function RelatedPages({ pages }: { pages: PageLink[] }) {
  if (pages.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Related
      </h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {pages.map((p) => (
          <li key={p.href}>
            <Link
              href={p.href}
              className="block rounded-lg border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 hover:border-emerald-300 hover:text-emerald-800 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-emerald-800"
            >
              {p.icon ? `${p.icon} ` : ""}
              {p.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}