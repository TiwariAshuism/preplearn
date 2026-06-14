import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllSlugs, getPageBySlug } from "@/features/mdx-parser/lib/content";
import { rewriteInternalLinks } from "@/features/mdx-parser/lib/rewrite-internal-links";
import { compilePageMDX } from "@/features/mdx-parser/lib/mdx";
import { TemplatePage } from "@/features/mdx-parser/components/TemplatePage";

export const dynamicParams = false;

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getPageBySlug(slug);

  if (!page) {
    return { title: "Not Found" };
  }

  return {
    title: `${page.frontmatter.title} | PrepLearn`,
    description: page.frontmatter.title,
  };
}

export default async function TemplatesDocPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const page = getPageBySlug(slug);

  if (!page) {
    notFound();
  }

  const markdown = rewriteInternalLinks(
    page.content,
    page.children,
    page.slug,
  );
  const { content } = await compilePageMDX(markdown);

  return (
    <TemplatePage
      frontmatter={page.frontmatter}
      breadcrumbs={page.breadcrumbs}
      pageContext={page.pageContext}
      slug={page.slug}
      content={content}
    />
  );
}
