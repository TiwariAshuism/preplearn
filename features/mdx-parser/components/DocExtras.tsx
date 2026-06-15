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
      className="mb-8 lg:hidden"
    >
      <details className="group rounded-lg border border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/40">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:content-none">
          <span className="min-w-0 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              On this page
            </span>
            <span className="ml-1.5 font-normal text-zinc-400">
              · {headings.length} topics
            </span>
          </span>
          <span
            className="shrink-0 text-xs font-medium text-emerald-700 transition-transform group-open:rotate-180 dark:text-emerald-400"
            aria-hidden
          >
            ▾
          </span>
        </summary>
        <ul className="mobile-scroll-panel space-y-1 overflow-y-auto border-t border-zinc-200 px-4 py-3 text-sm min-[390px]:text-[0.9375rem] dark:border-zinc-800">
          {headings.map((h) => (
            <li key={h.id} style={{ paddingLeft: h.level === 3 ? "0.75rem" : 0 }}>
              <a
                href={`#${h.id}`}
                className="block rounded-md py-1 text-zinc-600 hover:text-emerald-700 dark:text-zinc-400 dark:hover:text-emerald-400"
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      </details>
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
      className="hidden lg:block"
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
      className="mt-10 grid gap-3 border-t border-zinc-200 pt-8 dark:border-zinc-800 min-[420px]:grid-cols-2"
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
      <ul className="mt-3 grid gap-2 min-[420px]:grid-cols-2 xl:grid-cols-3">
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