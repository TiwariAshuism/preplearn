export type RoadmapCategory =
  | "backend"
  | "system-design"
  | "mobile"
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
  { id: "reference", label: "Deep Notes" },
];

export const ROADMAP_CATEGORY_LABELS: Record<RoadmapCategory, string> = {
  backend: "Backend",
  "system-design": "System Design",
  mobile: "Mobile",
  reference: "Deep Notes",
};

export function inferRoadmapCategory(
  slugKey: string,
  title: string,
): RoadmapCategory {
  const slug = slugKey.toLowerCase();
  const text = title.toLowerCase();

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

  if (
    slug.includes("backend-engineering") ||
    (text.includes("backend") && slug.includes("90-day"))
  ) {
    return "backend";
  }

  return "reference";
}

export function cleanRoadmapTitle(title: string): string {
  return title.replace(/^[^\w\s]+\s*/, "").trim();
}
