import { getHomeContent } from "@/features/home/lib/content";
import { CollectionGrid } from "@/features/home/components/CollectionGrid";
import { HomeHero } from "@/features/home/components/HomeHero";
import { HowItWorks } from "@/features/home/components/HowItWorks";
import { SiteFooter } from "@/features/home/components/SiteFooter";
import { SiteHeader } from "@/features/home/components/SiteHeader";

export default function Home() {
  const content = getHomeContent();

  return (
    <div className="flex min-h-dvh flex-col bg-white dark:bg-zinc-950">
      <SiteHeader />
      <main className="flex-1">
        <HomeHero content={content} />
        <CollectionGrid
          collections={content.collections}
          standalonePages={content.standalonePages}
        />
        <HowItWorks />
      </main>
      <SiteFooter />
    </div>
  );
}
