import type { Metadata } from "next";
import Link from "next/link";
import { getHomeContent } from "@/features/home/lib/content";
import { CollectionGrid } from "@/features/home/components/CollectionGrid";
import { readSyncMeta, formatSyncDate } from "@/features/mdx-parser/lib/sync-meta";
import { SiteHeader } from "@/features/home/components/SiteHeader";
import { SiteFooter } from "@/features/home/components/SiteFooter";

export const metadata: Metadata = {
  title: "All Roadmaps | PrepLearn",
  description: "Browse all learning roadmaps and detailed notes.",
};

export default function TemplatesCatalogPage() {
  const content = getHomeContent();
  const syncMeta = readSyncMeta();

  return (
    <div className="flex min-h-full flex-col bg-white dark:bg-zinc-950">
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-zinc-200 bg-zinc-50 px-6 py-12 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="mx-auto max-w-6xl">
            <Link
              href="/"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              ← Home
            </Link>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              All roadmaps & notes
            </h1>
            <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
              Each folder is a separate learning path. Pick a roadmap to start —
              sidebar navigation shows only that topic.
            </p>

            {syncMeta && syncMeta.roots.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-3">
                {syncMeta.roots.map((root) => (
                  <span
                    key={root.id}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
                    title={`Notion root ${root.id}`}
                  >
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {root.title}
                    </span>
                    <span className="text-zinc-400">·</span>
                    <span>
                      synced {formatSyncDate(root.syncedAt)} · {root.pageCount}{" "}
                      pages
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        <CollectionGrid
          collections={content.collections}
          standalonePages={content.standalonePages}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
