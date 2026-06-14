import type { Metadata } from "next";
import Link from "next/link";
import { getHomeContent } from "@/features/home/lib/content";
import { RoadmapCatalog } from "@/features/home/components/RoadmapCatalog";
import { SiteHeader } from "@/features/home/components/SiteHeader";
import { SiteFooter } from "@/features/home/components/SiteFooter";

export const metadata: Metadata = {
  title: "All Roadmaps | PrepLearn",
  description:
    "Browse backend, system design, mobile, and deep-dive learning roadmaps.",
};

export default function TemplatesCatalogPage() {
  const content = getHomeContent();

  return (
    <div className="flex min-h-full flex-col bg-white dark:bg-zinc-950">
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-zinc-200 bg-zinc-50 px-4 py-10 dark:border-zinc-800 dark:bg-zinc-900/40 sm:px-6 sm:py-12">
          <div className="mx-auto max-w-6xl">
            <Link
              href="/"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              ← Home
            </Link>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
              All roadmaps
            </h1>
            <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
              Pick a path that matches your goal — backend fundamentals, system
              design interviews, mobile development, or deep technical notes.
              Each roadmap opens with its own focused navigation.
            </p>
          </div>
        </section>

        <RoadmapCatalog
          collections={content.collections}
          standalonePages={content.standalonePages}
          showFilters
          showHeader={false}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
