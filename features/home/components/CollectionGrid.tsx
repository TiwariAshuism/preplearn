import type { HomeCollection, HomePageLink } from "../lib/content";
import { RoadmapCatalog } from "./RoadmapCatalog";

type CollectionGridProps = {
  collections: HomeCollection[];
  standalonePages: HomePageLink[];
};

export function CollectionGrid({
  collections,
  standalonePages,
}: CollectionGridProps) {
  return (
    <RoadmapCatalog
      collections={collections}
      standalonePages={standalonePages}
      showFilters
      showHeader
    />
  );
}
