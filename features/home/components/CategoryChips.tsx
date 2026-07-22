"use client";

import {
  ROADMAP_CATEGORY_FILTERS,
  type RoadmapCategoryFilter,
} from "../lib/categories";

type CategoryChipsProps = {
  active: RoadmapCategoryFilter;
  counts: Record<RoadmapCategoryFilter, number>;
  onSelect: (category: RoadmapCategoryFilter) => void;
  className?: string;
};

export function CategoryChips({
  active,
  counts,
  onSelect,
  className = "",
}: CategoryChipsProps) {
  return (
    <div
      className={`-mx-[var(--page-gutter)] overflow-x-auto px-[var(--page-gutter)] min-[428px]:mx-0 min-[428px]:overflow-visible min-[428px]:px-0 ${className}`}
      role="tablist"
      aria-label="Filter roadmaps by topic"
    >
      <div className="flex w-max min-w-full gap-2 pb-1 min-[428px]:w-auto min-[428px]:flex-wrap">
        {ROADMAP_CATEGORY_FILTERS.map((filter) => {
          const count = counts[filter.id];
          if (filter.id !== "all" && count === 0) return null;

          const isActive = active === filter.id;

          return (
            <button
              key={filter.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(filter.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 min-[390px]:px-4 min-[390px]:py-2.5 ${
                isActive
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "border border-zinc-200 bg-white text-zinc-600 hover:scale-[1.02] hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600"
              }`}
            >
              {filter.label}
              <span
                className={`ml-1.5 text-xs ${
                  isActive
                    ? "text-zinc-400 dark:text-zinc-500"
                    : "text-zinc-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
