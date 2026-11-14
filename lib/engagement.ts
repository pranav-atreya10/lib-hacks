import { typeLabel } from "./media";
import { offices } from "./offices";
import type { Resource } from "./content";

export interface Stats {
  views: number;
  likes: number;
  reviews: number;
  /** 0–1 heat score for the "trending" badge. */
  trend: number;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  body: string;
  date: string;
}

export type RecommenderByFile = Record<string, string | null>;

export interface EngagementSnapshot {
  likeCounts: Record<string, number>;
  liked: string[];
  likeOrder: string[];
  reviews: Review[];
  viewCounts: Record<string, number>;
  recommenders: RecommenderByFile;
  originals: Record<string, string>;
}

/** Small deterministic string hash — the same file always gets the same crowds. */
export function hash32(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

/**
 * Seed numbers are derived from the file id so server and client agree before
 * anyone touches localStorage, and so a shelf doesn't reset on every reload.
 */
export function seedStats(id: string): Stats {
  const hash = hash32(id);
  const views = 90 + (hash % 2600);
  const likeRate = 0.05 + ((hash >>> 5) % 90) / 1000;
  const likes = Math.max(2, Math.round(views * likeRate));
  const reviews = 1 + ((hash >>> 11) % 8);
  const trend = ((hash >>> 17) % 1000) / 1000;
  return { views, likes, reviews, trend };
}

export function trendingScore(id: string): number {
  const stats = seedStats(id);
  return stats.likes * 2 + stats.reviews * 5 + stats.views / 40 + stats.trend * 60;
}

export function isTrending(id: string): boolean {
  return seedStats(id).trend > 0.82;
}

const REVIEWERS = [
  "Priya S.",
  "Marcus T.",
  "Elena R.",
  "Tobi A.",
  "Sam K.",
  "Noor H.",
  "Luis M.",
  "Keiko W.",
  "Dana P.",
  "Owen B.",
  "Riya N.",
  "Alex D.",
];

const LINES = [
  "Read it on a flight and finished before landing. The middle chapter is the one I keep quoting.",
  "Dense at the start, worth it by the end. Give it a quiet hour.",
  "Someone handed this to me during onboarding. Still the best thing on my shelf.",
  "Not for everyone, but if you like systems thinking this is close to a cheat code.",
  "Skimmed it, then went back and read it properly. Glad I did.",
  "The kind of thing you recommend to one specific person, not a whole channel.",
  "Changed how I run my week. Small changes, real ones.",
  "Good, though a little long — the first half alone is worth the time.",
  "A colleague from another office left this on my desk. Literally.",
  "I disagreed with a third of it and still think about the other two thirds.",
  "The examples aged better than the predictions, which is rare.",
  "Put it down for a month, picked it up and read the rest in a weekend.",
];

function reviewDate(id: string, index: number): string {
  const hash = hash32(`${id}-review-${index}`);
  const month = 1 + (hash % 10);
  const day = 1 + ((hash >>> 8) % 27);
  return `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Seeded reviews: the starting social proof, before anyone adds their own. */
export function seedReviews(resource: Resource): Review[] {
  const stats = seedStats(resource.id);
  const count = Math.min(stats.reviews, 5);
  return Array.from({ length: count }, (_, index) => {
    const hash = hash32(`${resource.slug}-${index}`);
    return {
      id: `${resource.id}-seed-${index}`,
      author: REVIEWERS[hash % REVIEWERS.length],
      rating: 3 + ((hash >>> 4) % 3),
      body: LINES[(hash >>> 9) % LINES.length],
      date: reviewDate(resource.id, index),
    };
  });
}

export interface ShelfCard {
  /** Resource id. */
  id: string;
  /** Office code for the shelf card. */
  officeCode: string;
  /** Office city for the shelf card. */
  officeCity: string;
  /** Shelf type for the shelf card. */
  shelfType: string;
  /** Added date for the shelf card. */
  addedAt: string;
}

export function shelfCardForResource(resource: Resource): ShelfCard {
  const office = offices.find((office) => office.slug === resource.office);
  const officeCity = office
    ? `${office.city}, ${office.state}`
    : `${resource.office.split("-").slice(-1).join("-") || ""}`;

  return {
    id: resource.id,
    officeCode: office?.code ?? "",
    officeCity,
    shelfType: typeLabel(resource.type),
    addedAt: resource.addedAt,
  };
}

/**
 * Deterministic "who recommended this" as the office that picked it onto the
 * shelf — the reader of this shelf, never the author or maker of the work.
 *
 * Returns a record fileId -> office name (or null), so every shelf sees the
 * same answer and the card can render the office without storing state.
 */
export function fileRecommenders(resources: Resource[]): RecommenderByFile {
  const map: Record<string, string | null> = {};
  for (const resource of resources) {
    const office = offices.find((item) => item.slug === resource.office);
    map[resource.id] = office?.name ?? null;
  }
  return map;
}

/**
 * The same file always maps to the same office, so a shelf never flips
 * someone else's recommendation under you.
 */
export function seedRecommenders(resources: Resource[]): RecommenderByFile {
  const byFile: Record<string, string | null> = {};
  for (const resource of resources) {
    const office = offices.find((item) => item.slug === resource.office);
    byFile[resource.id] = office?.name ?? null;
  }
  return byFile;
}

/** Everything a dashboard says before it knows who is reading. */
export function libraryTotals(resources: Resource[]) {
  const totals = resources.reduce(
    (accumulator, resource) => {
      const stats = seedStats(resource.id);
      accumulator.views += stats.views;
      accumulator.likes += stats.likes;
      accumulator.reviews += stats.reviews;
      if (stats.trend > 0.82) accumulator.trending += 1;
      return accumulator;
    },
    { views: 0, likes: 0, reviews: 0, trending: 0 },
  );
  return totals;
}
