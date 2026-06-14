import Link from "next/link";
import type { HomeContent } from "../lib/content";

type HomeHeroProps = {
  content: HomeContent;
};

export function HomeHero({ content }: HomeHeroProps) {
  const { collections, stats } = content;
  const primary = collections[0];

  const headline =
    stats.collectionCount > 1
      ? "Your learning library,"
      : stats.collectionCount === 1
        ? "Structured paths,"
        : "Add content,";

  const headlineAccent =
    stats.collectionCount > 1
      ? "always in sync"
      : stats.collectionCount === 1
        ? "not random tutorials"
        : "ship docs";

  const subhead =
    stats.collectionCount > 0 ? (
      <>
        {stats.collectionCount} roadmap{stats.collectionCount !== 1 ? "s" : ""}{" "}
        · {stats.phaseCount} phase{stats.phaseCount !== 1 ? "s" : ""} ·{" "}
        {stats.totalPages} page{stats.totalPages !== 1 ? "s" : ""}. Sync from
        Notion or paste Markdown into{" "}
        <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-sm dark:bg-zinc-800">
          content/
        </code>{" "}
        — the homepage updates on the next build.
      </>
    ) : (
      <>
        Add Markdown to{" "}
        <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-sm dark:bg-zinc-800">
          content/
        </code>{" "}
        or connect Notion. Your docs appear here automatically.
      </>
    );

  return (
    <section className="relative overflow-hidden border-b border-zinc-200 dark:border-zinc-800">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-24 right-0 h-72 w-72 rounded-full bg-sky-400/15 blur-3xl dark:bg-sky-500/10"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-3 py-1 text-xs font-medium text-zinc-600 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {stats.totalPages > 0
            ? `${stats.totalPages} pages from content/`
            : "Waiting for content"}
        </div>

        <h1 className="mt-8 max-w-3xl text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl dark:text-zinc-50">
          {headline}{" "}
          <span className="bg-linear-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-sky-400">
            {headlineAccent}
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          {subhead}
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          {primary ? (
            <Link
              href={primary.href}
              className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-8 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {primary.icon ? `${primary.icon} ` : ""}
              Open {primary.title.replace(/^[^\w\s]+\s*/, "").slice(0, 32)}
              {primary.title.length > 35 ? "…" : ""}
            </Link>
          ) : (
            <Link
              href="/templates"
              className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-8 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Browse templates
            </Link>
          )}
          <Link
            href="/templates"
            className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-300 bg-white px-8 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            View all docs
          </Link>
        </div>

        {stats.collectionCount > 0 && (
          <dl className="mt-16 grid grid-cols-3 gap-6 border-t border-zinc-200 pt-10 dark:border-zinc-800 sm:max-w-lg">
            <div>
              <dt className="text-sm text-zinc-500">Roadmaps</dt>
              <dd className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                {stats.collectionCount}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-zinc-500">Phases</dt>
              <dd className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                {stats.phaseCount}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-zinc-500">Pages</dt>
              <dd className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                {stats.totalPages}
              </dd>
            </div>
          </dl>
        )}
      </div>
    </section>
  );
}
