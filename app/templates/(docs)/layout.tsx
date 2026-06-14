import { getNavTree } from "@/features/mdx-parser/lib/content";
import { TemplatesShell } from "@/features/mdx-parser/components/TemplatesShell";

export default function TemplatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navTree = getNavTree();

  return <TemplatesShell navTree={navTree}>{children}</TemplatesShell>;
}
