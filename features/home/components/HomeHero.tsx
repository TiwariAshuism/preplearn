import Link from "next/link";
import type { HomeContent } from "../lib/content";
import { cleanRoadmapTitle } from "../lib/categories";

type HomeHeroProps = {
  content: HomeContent;
};

export function HomeHero({ content }: HomeHeroProps) {
  const { collections, stats } = content;
  const primary = collections[0];

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

      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-3 py-1 text-xs font-medium text-zinc-600 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {stats.collectionCount > 0
            ? `${stats.collectionCount} structured roadmaps`
            : "Structured learning paths"}
        </div>

        <h1 className="mt-8 max-w-3xl text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl dark:text-zinc-50">
          Master backend & system design{" "}
          <span className="bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-400">
            one phase at a time
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Structured 90-day paths for backend engineering, low-level design,
          high-level design, and mobile — plus deep-dive notes on Go, networking,
          databases, and production systems. Work through phases in order; each
          builds on the last.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          {primary ? (
            <Link
              href={primary.href}
              className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-8 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {primary.icon ? `${primary.icon} ` : ""}
              Start{" "}
              {cleanRoadmapTitle(primary.title).slice(0, 36)}
              {cleanRoadmapTitle(primary.title).length > 36 ? "…" : ""}
            </Link>
          ) : (
            <Link
              href="/templates"
              className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-8 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Browse roadmaps
            </Link>
          )}
          <Link
            href="/templates"
            className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-300 bg-white px-8 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            View all roadmaps
          </Link>
        </div>

        {stats.collectionCount > 0 && (
          <dl className="mt-12 grid grid-cols-3 gap-3 border-t border-zinc-200 pt-8 dark:border-zinc-800 sm:mt-16 sm:max-w-lg sm:gap-6 sm:pt-10">
            <div>
              <dt className="text-xs text-zinc-500 sm:text-sm">Roadmaps</dt>
              <dd className="mt-1 text-xl font-semibold text-zinc-900 sm:text-2xl dark:text-zinc-50">
                {stats.collectionCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500 sm:text-sm">Phases</dt>
              <dd className="mt-1 text-xl font-semibold text-zinc-900 sm:text-2xl dark:text-zinc-50">
                {stats.phaseCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500 sm:text-sm">Topics</dt>
              <dd className="mt-1 text-xl font-semibold text-zinc-900 sm:text-2xl dark:text-zinc-50">
                {stats.totalPages}
              </dd>
            </div>
          </dl>
        )}
      </div>
    </section>
  );
}
