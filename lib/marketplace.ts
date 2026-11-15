import { CATALOG, type CatalogItem } from "./catalog";
import type { TagId } from "./tags";

/**
 * The marketplace: curated topic collections any library can add in one
 * click, and templates that start a new library with collections in it.
 */

export interface Collection {
  key: string;
  name: string;
  description: string;
  /** Catalogue items carrying any of these tags are in the collection. */
  tags: TagId[];
}

export const COLLECTIONS: Collection[] = [
  {
    key: "leadership",
    name: "Leadership & Management",
    description: "First-time managers to seasoned execs: feedback, 1:1s, running teams.",
    tags: ["leadership", "career"],
  },
  {
    key: "finance",
    name: "Finance, Markets & Crypto",
    description: "Investing, markets and how money moves.",
    tags: ["finance"],
  },
  {
    key: "strategy",
    name: "Strategy & Product",
    description: "How good companies decide what to build and what to ignore.",
    tags: ["strategy", "product"],
  },
  {
    key: "engineering",
    name: "Engineering & AI",
    description: "Systems, reliability, AI and the craft of building software.",
    tags: ["engineering", "ai", "security", "data"],
  },
  {
    key: "design",
    name: "Design & Craft",
    description: "Taste, usability and the details people notice without knowing why.",
    tags: ["design", "craft"],
  },
  {
    key: "communication",
    name: "Writing & Communication",
    description: "Storytelling, writing well and hard conversations.",
    tags: ["communication", "storytelling"],
  },
  {
    key: "customers",
    name: "Customers & Sales",
    description: "Negotiation, customer success and selling without being slimy.",
    tags: ["customer", "sales"],
  },
  {
    key: "wellbeing",
    name: "Culture & Wellbeing",
    description: "Habits, rest and the culture that makes work worth doing.",
    tags: ["culture", "wellbeing", "operations"],
  },
];

export interface Template {
  key: string;
  name: string;
  description: string;
  collections: string[];
}

export const TEMPLATES: Template[] = [
  {
    key: "team",
    name: "Team library",
    description: "A shared shelf for one team or practice.",
    collections: ["leadership", "communication"],
  },
  {
    key: "new-managers",
    name: "First-time Managers",
    description: "A monthly read and a 30-minute chat for people new to leading.",
    collections: ["leadership"],
  },
  {
    key: "markets",
    name: "Markets Morning",
    description: "One finance piece a week, argued over coffee.",
    collections: ["finance", "strategy"],
  },
  {
    key: "ai-group",
    name: "AI Reading Group",
    description: "Papers, talks and essays on where AI is going.",
    collections: ["engineering"],
  },
  {
    key: "writers",
    name: "Writers' Room",
    description: "For anyone who writes for a living, or wants to.",
    collections: ["communication"],
  },
  {
    key: "wellbeing",
    name: "Wellbeing Circle",
    description: "Sleep, habits and burnout — the books nobody makes time for.",
    collections: ["wellbeing"],
  },
];

export function collectionByKey(key: string): Collection | undefined {
  return COLLECTIONS.find((collection) => collection.key === key);
}

export function templateByKey(key: string): Template | undefined {
  return TEMPLATES.find((template) => template.key === key);
}

/** Catalogue items in a collection. */
export function collectionItems(collection: Collection): CatalogItem[] {
  return CATALOG.filter((item) => item.tags.some((tag) => collection.tags.includes(tag)));
}
