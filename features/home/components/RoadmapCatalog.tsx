"use client";

import { useMemo, useState } from "react";
import type { HomeCollection, HomePageLink } from "../lib/content";
import {
  ROADMAP_CATEGORY_FILTERS,
  buildCategoryCounts,
  type RoadmapCategoryFilter,
} from "../lib/categories";
import { AnimateIn } from "@/features/ui/components/AnimateIn";
import { RoadmapCard } from "./RoadmapCard";

type RoadmapCatalogProps = {
  collections: HomeCollection[];
  standalonePages?: HomePageLink[];
  showFilters?: boolean;
  showHeader?: boolean;
  emptyMessage?: string;
};

export function RoadmapCatalog({
  collections,
  standalonePages = [],
  showFilters = false,
  showHeader = true,
  emptyMessage = "No roadmaps match this filter.",
}: RoadmapCatalogProps) {
  const [category, setCategory] = useState<RoadmapCategoryFilter>("all");

  const filtered = useMemo(() => {
    if (category === "all") return collections;
    return collections.filter((c) => c.category === category);
  }, [collections, category]);

  const categoryCounts = useMemo(
    () => buildCategoryCounts(collections),
    [collections],
  );

  if (collections.length === 0 && standalonePages.length === 0) {
    return (
      <section className="mx-auto max-w-6xl px-6 py-20 text-center xl:max-w-7xl">
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Roadmaps will appear here once content is added.
        </p>
      </section>
    );
  }

  return (
    <section className="page-gutter-x site-container py-12 min-[390px]:py-14 min-[428px]:py-16 sm:py-16 xl:py-20">
      {showHeader && (
        <AnimateIn>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Learning paths
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 min-[390px]:text-[1.75rem] min-[428px]:text-3xl dark:text-zinc-50">
              {collections.length === 1
                ? "Your roadmap"
                : `${collections.length} roadmaps to explore`}
            </h2>
          </div>
          </div>
        </AnimateIn>
      )}

      {showFilters && collections.length > 0 && (
        <div
          className="-mx-[var(--page-gutter)] mt-8 overflow-x-auto px-[var(--page-gutter)] min-[428px]:mx-0 min-[428px]:overflow-visible min-[428px]:px-0"
          role="tablist"
          aria-label="Filter roadmaps by topic"
        >
          <div className="flex w-max min-w-full gap-2 pb-1 min-[428px]:w-auto min-[428px]:flex-wrap">
            {ROADMAP_CATEGORY_FILTERS.map((filter) => {
            const count = categoryCounts[filter.id];
            if (filter.id !== "all" && count === 0) return null;

            const active = category === filter.id;

            return (
              <button
                key={filter.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setCategory(filter.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 min-[390px]:px-4 min-[390px]:py-2.5 ${
                  active
                    ? "scale-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:scale-[1.02] hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600"
                }`}
              >
                {filter.label}
                <span
                  className={`ml-1.5 text-xs ${active ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-400"}`}
                >
                  {count}
                </span>
              </button>
            );
            })}
          </div>
        </div>
      )}

      {filtered.length > 0 ? (
        <div
          className={`grid gap-4 min-[420px]:grid-cols-2 min-[420px]:gap-5 xl:grid-cols-3 xl:gap-6 2xl:grid-cols-4 ${showFilters || showHeader ? "mt-8" : ""}`}
        >
          {filtered.map((collection, index) => (
            <AnimateIn key={collection.href} delay={index * 70}>
              <RoadmapCard collection={collection} />
            </AnimateIn>
          ))}
        </div>
      ) : (
        <p className="mt-8 text-center text-zinc-500">{emptyMessage}</p>
      )}

      {standalonePages.length > 0 && (
        <div className="mt-14">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Additional notes
          </h2>
          <ul className="mt-4 grid gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {standalonePages.map((page, index) => (
              <AnimateIn key={page.href} as="li" delay={index * 60}>
                <a
                  href={page.href}
                  className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/30 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-900"
                >
                  <span className="text-xl">{page.icon ?? "📄"}</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {page.title}
                  </span>
                </a>
              </AnimateIn>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
