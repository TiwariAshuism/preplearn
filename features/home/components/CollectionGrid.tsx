import { Suspense } from "react";
import type { HomeCollection, HomePageLink } from "../lib/content";
import { RoadmapCatalog } from "./RoadmapCatalog";

type CollectionGridProps = {
  collections: HomeCollection[];
  standalonePages: HomePageLink[];
};

function CatalogFallback({
  collections,
}: {
  collections: HomeCollection[];
}) {
  return (
    <section className="page-gutter-x site-container py-12 min-[390px]:py-14 min-[428px]:py-16 sm:py-16 xl:py-20">
      <p className="text-sm font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
        Learning paths
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 min-[390px]:text-[1.75rem] min-[428px]:text-3xl dark:text-zinc-50">
        {collections.length === 1
          ? "Your roadmap"
          : `${collections.length} roadmaps to explore`}
      </h2>
      <div className="mt-8 h-10 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
    </section>
  );
}

export function CollectionGrid({
  collections,
  standalonePages,
}: CollectionGridProps) {
  return (
    <Suspense fallback={<CatalogFallback collections={collections} />}>
      <RoadmapCatalog
        collections={collections}
        standalonePages={standalonePages}
        showFilters
        showHeader
      />
    </Suspense>
  );
}
