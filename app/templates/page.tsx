import type { Metadata } from "next";
import Link from "next/link";
import { getHomeContent } from "@/features/home/lib/content";
import { RoadmapCatalog } from "@/features/home/components/RoadmapCatalog";
import { SiteHeader } from "@/features/home/components/SiteHeader";
import { SiteFooter } from "@/features/home/components/SiteFooter";

export const metadata: Metadata = {
  title: "All Roadmaps | PrepLearn",
  description:
    "Browse backend, system design, mobile, DevOps, blockchain, quant, and deep-dive learning roadmaps.",
};

export default function TemplatesCatalogPage() {
  const content = getHomeContent();

  return (
    <div className="flex min-h-dvh flex-col bg-white dark:bg-zinc-950">
      <SiteHeader />
      <main className="flex-1">
        <section className="page-gutter-x site-container border-b border-zinc-200 bg-zinc-50 py-10 min-[390px]:py-12 min-[428px]:py-14 xl:py-16 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div>
            <Link
              href="/"
              className="animate-on-load text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              ← Home
            </Link>
            <h1 className="animate-on-load-delay-1 mt-4 text-2xl font-bold tracking-tight text-zinc-900 min-[390px]:text-[1.75rem] min-[428px]:text-3xl xl:text-4xl dark:text-zinc-50">
              All roadmaps
            </h1>
            <p className="animate-on-load-delay-2 mt-2 max-w-2xl text-zinc-600 xl:max-w-3xl dark:text-zinc-400">
              Pick a path that matches your goal — backend fundamentals, system
              design, mobile, DevOps & cloud, blockchain, quant, or deep
              technical notes.
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
