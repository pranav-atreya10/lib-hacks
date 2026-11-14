export const TAGS = [
  "ai",
  "leadership",
  "strategy",
  "product",
  "engineering",
  "design",
  "craft",
  "data",
  "security",
  "finance",
  "sales",
  "customer",
  "operations",
  "communication",
  "culture",
  "career",
  "wellbeing",
  "storytelling",
] as const;

export type TagId = (typeof TAGS)[number];

const LABELS: Record<TagId, string> = {
  ai: "AI",
  leadership: "Leadership",
  strategy: "Strategy",
  product: "Product",
  engineering: "Engineering",
  design: "Design",
  craft: "Craft",
  data: "Data",
  security: "Security",
  finance: "Finance",
  sales: "Sales",
  customer: "Customer",
  operations: "Operations",
  communication: "Communication",
  culture: "Culture",
  career: "Career",
  wellbeing: "Wellbeing",
  storytelling: "Storytelling",
};

export function tagLabel(tag: TagId): string {
  return LABELS[tag];
}

export function isTag(value: string): value is TagId {
  return (TAGS as readonly string[]).includes(value);
}
