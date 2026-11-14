import type { MediaType } from "./catalog";
import type { Resource } from "./content";
import { seedStats, seedReviews, type Review, type Stats } from "./engagement";
import type { Persona } from "./personas";
import { oppositesOf } from "./personas";
import { tagLabel, type TagId } from "./tags";
import { officeBySlug } from "./offices";

export interface LocalReview extends Review {
  resourceId: string;
  personaId: string;
}

/** A file a persona added themselves. Stored in the browser, not the catalogue. */
export interface AddedResource {
  id: string;
  slug: string;
  personaId: string;
  title: string;
  creator: string;
  type: MediaType;
  tags: TagId[];
  length: string;
  url: string;
  blurb: string;
  addedAt: string;
  office: string;
}

export interface PersonaEngagement {
  likes: string[];
  views: Record<string, number>;
  reviews: LocalReview[];
  added: AddedResource[];
}

export const emptyEngagement: PersonaEngagement = {
  likes: [],
  views: {},
  reviews: [],
  added: [],
};

export interface RankedResource {
  resource: Resource;
  stats: Stats;
  reasons: string[];
  score: number;
}

export function addedToResource(item: AddedResource): Resource {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    creator: item.creator,
    type: item.type,
    tags: item.tags,
    length: item.length,
    url: item.url,
    blurb: item.blurb,
    office: item.office,
    ordinal: 90,
    addedAt: item.addedAt,
    featured: false,
  };
}

/** Seed numbers plus whatever this person has done locally. */
export function statsFor(resource: Resource, engagement: PersonaEngagement): Stats {
  return statsAcross(resource, [engagement]);
}

/**
 * Seed numbers plus everything everyone in this browser has done: every
 * person's like, view and review counts toward the crowd.
 */
export function statsAcross(resource: Resource, everyone: PersonaEngagement[]): Stats {
  const base = seedStats(resource.id);
  let views = base.views;
  let likes = base.likes;
  let reviews = base.reviews;
  for (const engagement of everyone) {
    views += engagement.views[resource.id] ?? 0;
    if (engagement.likes.includes(resource.id)) likes += 1;
    for (const review of engagement.reviews) {
      if (review.resourceId === resource.id) reviews += 1;
    }
  }
  return { views, likes, reviews, trend: base.trend };
}

export function reviewsFor(resource: Resource, everyone: PersonaEngagement[]): Review[] {
  const local = everyone
    .flatMap((engagement) => engagement.reviews)
    .filter((review) => review.resourceId === resource.id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(({ id, author, rating, body, date }) => ({ id, author, rating, body, date }));
  return [...local, ...seedReviews(resource)];
}

/**
 * How much the crowd likes a file. Likes count most, reviews next, views
 * least; logs keep one viral file from burying everything else.
 */
export function crowdScore(stats: Stats): number {
  return (
    0.9 * Math.log2(1 + stats.likes) +
    0.4 * Math.log2(1 + stats.views) +
    0.6 * Math.min(stats.reviews, 10) +
    3 * stats.trend
  );
}

/** The visitor's ranking: what the whole company is reading right now. */
export function rankTrending(
  resources: Resource[],
  statsOf: (resource: Resource) => Stats,
): RankedResource[] {
  return resources
    .map((resource) => {
      const stats = statsOf(resource);
      const reasons: string[] = [];
      if (stats.trend > 0.82) reasons.push("Trending this week");
      if (stats.likes > 180) reasons.push("Most liked");
      return { resource, stats, reasons, score: crowdScore(stats) };
    })
    .sort((a, b) => b.score - a.score || a.resource.title.localeCompare(b.resource.title));
}

/**
 * What this person should read next, given their interests, their office and
 * the things they've already liked or added. Deterministic before hydration.
 */
export function rankResources(
  resources: Resource[],
  persona: Persona,
  engagement: PersonaEngagement,
  statsOf: (resource: Resource) => Stats = (resource) => statsFor(resource, engagement),
): RankedResource[] {
  const office = officeBySlug.get(persona.office);
  const addedIds = new Set(engagement.added.map((item) => item.id));

  const scored = resources
    .map((resource) => {
      const stats = statsOf(resource);
      const matches = resource.tags.filter((tag) => persona.interests.includes(tag));
      const reasons: string[] = [];
      let score = 0;

      if (matches.length > 0) {
        score += matches.length * 10;
        reasons.push(`Matches ${matches.map((tag) => tagLabel(tag)).join(" & ")}`);
      }
      if (resource.office === persona.office && office) {
        score += 5;
        reasons.push(`${office.city} pick`);
      }
      if (addedIds.has(resource.id)) {
        score += 60;
        reasons.unshift("Added by you");
      }
      if (engagement.likes.includes(resource.id)) {
        score += 8;
        reasons.push("You liked this");
      }
      if (engagement.reviews.some((review) => review.resourceId === resource.id)) {
        score += 6;
        reasons.push("You reviewed this");
      }
      const localViews = engagement.views[resource.id] ?? 0;
      if (localViews > 0) score += Math.min(3, localViews * 1.5);
      if (stats.trend > 0.82) {
        score += 4;
        reasons.push("Trending this week");
      }
      if (stats.likes > 180) reasons.push("Most liked");

      // Likes, reviews and views from everyone: enough to reorder a shelf,
      // never enough to bury a personal match.
      score += crowdScore(stats);

      return { resource, stats, reasons, score };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.resource.addedAt.localeCompare(a.resource.addedAt) ||
        a.resource.title.localeCompare(b.resource.title),
    );

  // The catalogue repeats a title across office shelves; rank each work once.
  const seen = new Set<string>();
  return scored.filter((entry) => {
    if (seen.has(entry.resource.slug)) return false;
    seen.add(entry.resource.slug);
    return true;
  });
}

export interface OutsidePick {
  persona: Persona;
  entry: RankedResource;
}

/**
 * The anti-feed: files high on someone else's ranking that don't touch this
 * persona's tags. Deliberately not filtered by what they already like.
 */
export function outsideBubble(
  persona: Persona,
  resources: Resource[],
  count = 3,
): OutsidePick[] {
  const seen = new Set<string>();
  const picks: OutsidePick[] = [];

  for (const other of oppositesOf(persona, 2)) {
    const ranked = rankResources(resources, other, emptyEngagement).filter(
      (entry) =>
        !entry.resource.tags.some((tag) => persona.interests.includes(tag)) &&
        entry.resource.office !== persona.office &&
        !seen.has(entry.resource.slug),
    );
    for (const entry of ranked.slice(0, 2)) {
      if (picks.length >= count) return picks;
      seen.add(entry.resource.slug);
      picks.push({ persona: other, entry });
    }
  }

  return picks;
}
