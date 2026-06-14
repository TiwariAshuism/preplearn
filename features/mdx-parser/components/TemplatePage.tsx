import type { ReactNode } from "react";
import type { Breadcrumb, PageContext, PageFrontmatter } from "../lib/types";
import { Breadcrumbs } from "./Breadcrumbs";
import {
  DocSidebarToc,
  PrevNextNav,
  RelatedPages,
  TableOfContents,
} from "./DocExtras";
import { Checklist, ProgressTracker } from "./LearningTools";
import { CodeBlockCopy, PrintButton } from "./TemplateEnhancements";

type TemplatePageProps = {
  frontmatter: PageFrontmatter;
  breadcrumbs: Breadcrumb[];
  pageContext: PageContext;
  slug: string[];
  content: ReactNode;
};

export function TemplatePage({
  frontmatter,
  breadcrumbs,
  pageContext,
  slug,
  content,
}: TemplatePageProps) {
  const pageHref = `/templates/${slug.join("/")}`;

  return (
    <article className="xl:grid xl:grid-cols-[1fr_220px] xl:gap-10">
      <div className="min-w-0">
        <CodeBlockCopy />
        <Breadcrumbs items={breadcrumbs} />

        <ProgressTracker
          collectionKey={pageContext.collectionSlug.join("/") || "root"}
          phases={pageContext.phaseLinks}
          currentHref={pageHref}
        />

        {frontmatter.cover && (
          <div className="mb-6 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={frontmatter.cover}
              alt=""
              className="h-48 w-full object-cover"
            />
          </div>
        )}

        <header className="mb-6 border-b border-zinc-200 pb-6 dark:border-zinc-800">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {frontmatter.icon ? `${frontmatter.icon} ` : ""}
              {frontmatter.title}
            </h1>
            <PrintButton />
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            {pageContext.readingMinutes} min read
            {pageContext.estimatedDays
              ? ` · Days ${pageContext.estimatedDays}`
              : ""}
            {frontmatter.source === "notion" ? " · Notion" : ""}
          </p>
        </header>

        <TableOfContents headings={pageContext.toc} />

        <div className="mdx-prose print:max-w-none">{content}</div>

        {pageContext.checklist.length > 0 && (
          <Checklist
            items={pageContext.checklist}
            storageKey={`preplearn:checklist:${slug.join("/")}`}
          />
        )}

        <RelatedPages pages={pageContext.related} />
        <PrevNextNav prev={pageContext.prev} next={pageContext.next} />
      </div>

      <aside className="hidden xl:block">
        <div className="sticky top-8">
          <DocSidebarToc headings={pageContext.toc} />
        </div>
      </aside>
    </article>
  );
}
