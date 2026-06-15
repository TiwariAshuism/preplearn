export type RoadmapCategory =
  | "backend"
  | "system-design"
  | "mobile"
  | "devops"
  | "blockchain"
  | "quant"
  | "reference";

export type RoadmapCategoryFilter = "all" | RoadmapCategory;

export const ROADMAP_CATEGORY_FILTERS: {
  id: RoadmapCategoryFilter;
  label: string;
}[] = [
  { id: "all", label: "All" },
  { id: "backend", label: "Backend" },
  { id: "system-design", label: "System Design" },
  { id: "mobile", label: "Mobile" },
  { id: "devops", label: "DevOps & Cloud" },
  { id: "blockchain", label: "Blockchain" },
  { id: "quant", label: "Quant" },
  { id: "reference", label: "Deep Notes" },
];

export const ROADMAP_CATEGORY_LABELS: Record<RoadmapCategory, string> = {
  backend: "Backend",
  "system-design": "System Design",
  mobile: "Mobile",
  devops: "DevOps & Cloud",
  blockchain: "Blockchain",
  quant: "Quant",
  reference: "Deep Notes",
};

const VALID_CATEGORIES = new Set<RoadmapCategory>([
  "backend",
  "system-design",
  "mobile",
  "devops",
  "blockchain",
  "quant",
  "reference",
]);

/** Manual phase deep-dives at content root (parallel to the 90-day backend roadmap). */
function isStandalonePhaseNotes(slug: string): boolean {
  if (slug === "phase4-infra-devops") return false;
  return /^phase[1-4][-_]/.test(slug);
}

function isDeepNotesCollection(slug: string): boolean {
  return slug === "go_lang_notes" || slug === "distributed-systems";
}

export function resolveRoadmapCategory(
  slugKey: string,
  title: string,
  frontmatterCategory?: unknown,
): RoadmapCategory {
  if (
    typeof frontmatterCategory === "string" &&
    VALID_CATEGORIES.has(frontmatterCategory as RoadmapCategory)
  ) {
    return frontmatterCategory as RoadmapCategory;
  }

  return inferRoadmapCategory(slugKey, title);
}

export function inferRoadmapCategory(
  slugKey: string,
  title: string,
): RoadmapCategory {
  const slug = slugKey.toLowerCase();
  const text = title.toLowerCase();

  if (isStandalonePhaseNotes(slug) || isDeepNotesCollection(slug)) {
    return "reference";
  }

  if (
    slug.includes("android") ||
    slug.includes("kotlin") ||
    slug.includes("kmp") ||
    text.includes("android") ||
    text.includes("kotlin") ||
    text.includes("kmp")
  ) {
    return "mobile";
  }

  if (
    slug.includes("hld") ||
    slug.includes("lld") ||
    slug.includes("system-design") ||
    text.includes("high-level system") ||
    text.includes("low-level system") ||
    text.includes("system design")
  ) {
    return "system-design";
  }

  if (slug.includes("blockchain") || text.includes("blockchain")) {
    return "blockchain";
  }

  if (slug.includes("quant") || text.includes("quant")) {
    return "quant";
  }

  if (
    slug.includes("docker") ||
    slug.includes("kubernetes") ||
    slug.includes("aws") ||
    slug.includes("floci") ||
    slug.includes("devops") ||
    slug.includes("infra") ||
    text.includes("devops") ||
    text.includes("kubernetes") ||
    text.includes("docker")
  ) {
    return "devops";
  }

  if (
    slug.includes("backend-engineering") ||
    slug.includes("30-day") ||
    (text.includes("backend") &&
      (slug.includes("90-day") || slug.includes("roadmap")))
  ) {
    return "backend";
  }

  return "reference";
}

export function cleanRoadmapTitle(title: string): string {
  return title.replace(/^[^\w\s]+\s*/, "").trim();
}

export function buildCategoryCounts(
  collections: { category: RoadmapCategory }[],
): Record<RoadmapCategoryFilter, number> {
  const counts = Object.fromEntries(
    ROADMAP_CATEGORY_FILTERS.map((filter) => [
      filter.id,
      filter.id === "all" ? collections.length : 0,
    ]),
  ) as Record<RoadmapCategoryFilter, number>;

  for (const collection of collections) {
    counts[collection.category] += 1;
  }

  return counts;
}
