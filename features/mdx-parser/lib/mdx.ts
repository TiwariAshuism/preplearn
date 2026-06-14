import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import { MdxLink } from "../components/MdxLink";
import { sanitizeMdxSource } from "./sanitize-mdx";

const mdxComponents = {
  a: MdxLink,
};

export async function compilePageMDX(source: string) {
  const safeSource = sanitizeMdxSource(source);

  return compileMDX({
    source: safeSource,
    components: mdxComponents,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" as const }],
          [
            rehypePrettyCode,
            {
              theme: "nord",
              keepBackground: true,
            },
          ],
        ],
      },
    },
  });
}
