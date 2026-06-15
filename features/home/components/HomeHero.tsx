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
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 animate-pulse rounded-full bg-emerald-400/20 blur-3xl motion-reduce:animate-none dark:bg-emerald-500/10"
        aria-hidden
      />

      <div className="page-gutter-x site-container relative py-16 min-[390px]:py-20 min-[428px]:py-24 sm:py-24 lg:py-32 xl:py-36">
        <div className="animate-on-load inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-3 py-1 text-xs font-medium text-zinc-600 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          {stats.collectionCount > 0
            ? `${stats.collectionCount} structured roadmaps`
            : "Structured learning paths"}
        </div>

        <h1 className="animate-on-load-delay-1 mt-8 max-w-3xl text-[2rem] font-bold leading-[1.1] tracking-tight text-zinc-900 min-[390px]:mt-9 min-[390px]:text-[2.35rem] min-[428px]:text-5xl sm:text-5xl lg:text-6xl xl:max-w-4xl 2xl:max-w-5xl dark:text-zinc-50">
          Master backend & system design{" "}
          <span className="bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-400">
            one phase at a time
          </span>
        </h1>

        <p className="animate-on-load-delay-2 mt-6 max-w-2xl text-base leading-7 text-zinc-600 min-[390px]:text-lg min-[390px]:leading-8 xl:max-w-3xl dark:text-zinc-400">
          Structured 90-day paths for backend engineering, low-level design,
          high-level design, and mobile — plus deep-dive notes on Go, networking,
          databases, and production systems. Work through phases in order; each
          builds on the last.
        </p>

        <div className="animate-on-load-delay-3 mt-10 flex flex-col gap-3 min-[390px]:gap-4 sm:flex-row">
          {primary ? (
            <Link
              href={primary.href}
              className="inline-flex h-12 min-h-11 items-center justify-center rounded-full bg-zinc-900 px-8 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:bg-zinc-700 active:scale-[0.98] min-[428px]:h-[3.25rem] min-[428px]:px-9 min-[428px]:text-base dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {primary.icon ? `${primary.icon} ` : ""}
              Start{" "}
              {cleanRoadmapTitle(primary.title).slice(0, 36)}
              {cleanRoadmapTitle(primary.title).length > 36 ? "…" : ""}
            </Link>
          ) : (
            <Link
              href="/templates"
              className="inline-flex h-12 min-h-11 items-center justify-center rounded-full bg-zinc-900 px-8 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:bg-zinc-700 active:scale-[0.98] min-[428px]:h-[3.25rem] min-[428px]:px-9 min-[428px]:text-base dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Browse roadmaps
            </Link>
          )}
          <Link
            href="/templates"
            className="inline-flex h-12 min-h-11 items-center justify-center rounded-full border border-zinc-300 bg-white px-8 text-sm font-semibold text-zinc-900 transition-all duration-200 hover:scale-[1.02] hover:bg-zinc-50 active:scale-[0.98] min-[428px]:h-[3.25rem] min-[428px]:px-9 min-[428px]:text-base dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            View all roadmaps
          </Link>
        </div>

        {stats.collectionCount > 0 && (
          <dl className="animate-on-load-delay-4 mt-12 grid grid-cols-3 gap-4 border-t border-zinc-200 pt-8 min-[390px]:gap-5 min-[390px]:pt-10 min-[428px]:max-w-xl sm:mt-16 sm:max-w-lg sm:gap-6 sm:pt-10 xl:max-w-2xl dark:border-zinc-800">
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
