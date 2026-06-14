export type ContentSource = "manual" | "notion";

export type PageFrontmatter = {
  source: ContentSource;
  title: string;
  slug: string;
  notionId: string | null;
  notionRootId: string | null;
  parent: string | null;
  children: string[];
  order: number;
  icon: string | null;
  cover: string | null;
  /** When true, skip this page in breadcrumbs (except when it is the current page). */
  hideInBreadcrumb?: boolean;
  related?: string[];
  checklist?: string[];
  estimatedDays?: string;
};

export type PageLink = {
  title: string;
  href: string;
  icon: string | null;
};

export type PageContext = {
  readingMinutes: number;
  estimatedDays: string | null;
  toc: { id: string; text: string; level: 2 | 3 }[];
  prev: PageLink | null;
  next: PageLink | null;
  related: PageLink[];
  checklist: string[];
  collectionSlug: string[];
  collectionTitle: string;
  phaseLinks: PageLink[];
};

export type SectionMeta = {
  title?: string;
  icon?: string | null;
  order?: number;
};

export type NavNode = {
  title: string;
  slug: string[];
  href: string;
  icon?: string | null;
  order: number;
  children: NavNode[];
  isSection?: boolean;
};

export type Breadcrumb = {
  title: string;
  href: string;
};

export type PageData = {
  frontmatter: PageFrontmatter;
  content: string;
  children: NavNode[];
  breadcrumbs: Breadcrumb[];
  slug: string[];
  pageContext: PageContext;
};

export type ParsedPage = {
  frontmatter: PageFrontmatter;
  content: string;
  filePath: string;
  slug: string[];
};
