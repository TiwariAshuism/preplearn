import Link from "next/link";
import type { HomeCollection } from "../lib/content";
import {
  ROADMAP_CATEGORY_LABELS,
  cleanRoadmapTitle,
} from "../lib/categories";

type RoadmapCardProps = {
  collection: HomeCollection;
};

function PhaseChip({
  child,
}: {
  child: HomeCollection["children"][number];
}) {
  const phaseNumber = child.title.match(/Phase\s+(\d+)/i)?.[1];

  return (
    <Link
      href={child.href}
      className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-medium text-zinc-700 transition-all duration-200 hover:scale-[1.03] hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
      title={child.title}
    >
      {child.icon ? <span>{child.icon}</span> : null}
      {phaseNumber ? `Phase ${phaseNumber}` : child.title.slice(0, 24)}
      {child.estimatedDays ? (
        <span className="text-zinc-400">· D{child.estimatedDays}</span>
      ) : null}
    </Link>
  );
}

export function RoadmapCard({ collection }: RoadmapCardProps) {
  const cleanTitle = cleanRoadmapTitle(collection.title);

  return (
    <article className="group flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200/60 hover:shadow-lg min-[390px]:p-6 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-emerald-900/40">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-2xl dark:bg-emerald-950/50"
            aria-hidden
          >
            {collection.icon ?? "📚"}
          </span>
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {ROADMAP_CATEGORY_LABELS[collection.category]}
          </span>
        </div>
        {collection.childCount > 0 && (
          <span className="shrink-0 text-xs font-medium text-zinc-500">
            {collection.childCount} phase
            {collection.childCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <h3 className="mt-4 text-lg font-semibold leading-snug text-zinc-900 min-[390px]:text-xl dark:text-zinc-50">
        <Link
          href={collection.href}
          className="hover:text-emerald-700 dark:hover:text-emerald-400"
        >
          {cleanTitle}
        </Link>
      </h3>

      <p className="mt-2 flex-1 text-sm leading-6 text-zinc-600 min-[390px]:text-[0.9375rem] min-[390px]:leading-7 dark:text-zinc-400">
        {collection.description}
      </p>

      {collection.children.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {collection.children.slice(0, 5).map((child) => (
            <PhaseChip key={child.href} child={child} />
          ))}
          {collection.children.length > 5 && (
            <span className="self-center px-1 text-xs text-zinc-500">
              +{collection.children.length - 5} more
            </span>
          )}
        </div>
      )}

      <Link
        href={collection.href}
        className="mt-5 inline-flex items-center text-sm font-semibold text-emerald-700 dark:text-emerald-400"
      >
        Start this roadmap
        <svg
          className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </Link>
    </article>
  );
}
