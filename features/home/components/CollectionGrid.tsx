import Link from "next/link";
import type { HomeCollection, HomePageLink } from "../lib/content";

const cardColors = [
  "from-violet-500/10 to-violet-600/5 border-violet-200/60 dark:border-violet-800/60",
  "from-sky-500/10 to-sky-600/5 border-sky-200/60 dark:border-sky-800/60",
  "from-emerald-500/10 to-emerald-600/5 border-emerald-200/60 dark:border-emerald-800/60",
  "from-amber-500/10 to-amber-600/5 border-amber-200/60 dark:border-amber-800/60",
  "from-rose-500/10 to-rose-600/5 border-rose-200/60 dark:border-rose-800/60",
  "from-indigo-500/10 to-indigo-600/5 border-indigo-200/60 dark:border-indigo-800/60",
];

type CollectionGridProps = {
  collections: HomeCollection[];
  standalonePages: HomePageLink[];
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
      className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/80 bg-white/60 px-3 py-1 text-xs font-medium text-zinc-700 transition-colors hover:border-emerald-300 hover:text-emerald-700 dark:border-zinc-700/80 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:border-emerald-700 dark:hover:text-emerald-400"
      title={child.title}
    >
      {child.icon ? <span>{child.icon}</span> : null}
      {phaseNumber ? `Phase ${phaseNumber}` : child.title.slice(0, 28)}
      {child.estimatedDays ? (
        <span className="text-zinc-400">· D{child.estimatedDays}</span>
      ) : null}
    </Link>
  );
}

export function CollectionGrid({
  collections,
  standalonePages,
}: CollectionGridProps) {
  if (collections.length === 0 && standalonePages.length === 0) {
    return (
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          No content yet. Run{" "}
          <code className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-sm dark:bg-zinc-800">
            bun run fetch-notion
          </code>{" "}
          or add files to{" "}
          <code className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-sm dark:bg-zinc-800">
            content/
          </code>
          .
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      {collections.length > 0 && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Learning roadmaps
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {collections.length === 1
                  ? "Your roadmap"
                  : `${collections.length} roadmaps to explore`}
              </h2>
            </div>
            <Link
              href="/templates"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Full docs index →
            </Link>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {collections.map((collection, index) => {
              const color = cardColors[index % cardColors.length];
              const cleanTitle = collection.title.replace(
                /^[^\w\s]+\s*/,
                "",
              );

              return (
                <article
                  key={collection.href}
                  className={`flex flex-col rounded-2xl border bg-linear-to-br ${color} p-6`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-3xl" aria-hidden>
                      {collection.icon ?? "📚"}
                    </span>
                    {collection.childCount > 0 && (
                      <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-900/80 dark:text-zinc-400">
                        {collection.childCount} phase
                        {collection.childCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-4 text-xl font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
                    <Link
                      href={collection.href}
                      className="hover:text-emerald-700 dark:hover:text-emerald-400"
                    >
                      {cleanTitle}
                    </Link>
                  </h3>

                  <p className="mt-2 flex-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    {collection.description}
                  </p>

                  {collection.children.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {collection.children.slice(0, 5).map((child) => (
                        <PhaseChip key={child.href} child={child} />
                      ))}
                      {collection.children.length > 5 && (
                        <span className="self-center text-xs text-zinc-500">
                          +{collection.children.length - 5} more
                        </span>
                      )}
                    </div>
                  )}

                  <Link
                    href={collection.href}
                    className="mt-5 inline-flex items-center text-sm font-semibold text-emerald-700 dark:text-emerald-400"
                  >
                    Open roadmap
                    <svg
                      className="ml-1 h-4 w-4"
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
            })}
          </div>
        </>
      )}

      {standalonePages.length > 0 && (
        <div className={collections.length > 0 ? "mt-16" : ""}>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            More pages
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {standalonePages.map((page) => (
              <li key={page.href}>
                <Link
                  href={page.href}
                  className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/80"
                >
                  <span className="text-xl">{page.icon ?? "📄"}</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {page.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
