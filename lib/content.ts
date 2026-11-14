import { CATALOG, type CatalogItem, type MediaType } from "./catalog";
import { BIG_OFFICE_SLUGS, offices } from "./offices";

export interface Resource extends CatalogItem {
  id: string;
  /** Office slug. Every resource belongs to the office that recommends it. */
  office: string;
  /** Position on its office's shelf, used for the catalog code. */
  ordinal: number;
  addedAt: string;
  featured?: boolean;
}

const BY_TYPE: Record<MediaType, CatalogItem[]> = {
  book: CATALOG.filter((item) => item.type === "book"),
  podcast: CATALOG.filter((item) => item.type === "podcast"),
  video: CATALOG.filter((item) => item.type === "video"),
  article: CATALOG.filter((item) => item.type === "article"),
};

/** Stable offset so "added" dates look organic without changing between builds. */
function hash(value: string): number {
  let out = 0;
  for (let i = 0; i < value.length; i += 1) {
    out = (out * 31 + value.charCodeAt(i)) % 100000;
  }
  return out;
}

const PLAN_FULL: [MediaType, number][] = [
  ["book", 3],
  ["podcast", 2],
  ["video", 2],
  ["article", 3],
];

function standardPlan(officeIndex: number): [MediaType, number][] {
  return [
    ["book", 1],
    // Alternate the middle slot so the company's shelves aren't all podcasts.
    [officeIndex % 2 === 0 ? "podcast" : "video", 1],
    ["article", 1],
  ];
}

/**
 * Each office keeps a balanced shelf — at least a book, something to listen to
 * or watch, and an article. Picks walk each type's pool in order, so every
 * catalogue item is used across the company and no office repeats a title.
 */
function buildResources(): Resource[] {
  const cursor: Record<MediaType, number> = {
    book: 0,
    podcast: 0,
    video: 0,
    article: 0,
  };

  const rows = offices.flatMap((office, officeIndex) => {
    const plan = BIG_OFFICE_SLUGS.has(office.slug)
      ? PLAN_FULL
      : standardPlan(officeIndex);

    return plan.flatMap(([type, howMany]) =>
      Array.from({ length: howMany }, () => {
        const pool = BY_TYPE[type];
        const item = pool[cursor[type] % pool.length];
        cursor[type] += 1;
        return { office, item };
      }),
    );
  });

  const ordinals = new Map<string, number>();
  return rows.map(({ office, item }) => {
    const ordinal = ordinals.get(office.slug) ?? 0;
    ordinals.set(office.slug, ordinal + 1);
    const id = `${office.code.toLowerCase()}-${item.slug}`;
    const day = hash(id) % 90;
    return {
      ...item,
      id,
      office: office.slug,
      ordinal,
      addedAt: new Date(Date.UTC(2026, 7, 1 + day)).toISOString().slice(0, 10),
    };
  });
}

export const RESOURCES: Resource[] = buildResources();

/**
 * The home page puts one card forward from each full shelf, and each of those
 * three is a different medium so the shelf doesn't read as three books.
 */
function pickFeatured(): Resource[] {
  const used = new Set<MediaType>();
  const picks: Resource[] = [];
  for (const slug of ["florham-park", "new-york-madison-ave", "new-york-park-ave"]) {
    const pick = RESOURCES.find(
      (resource) => resource.office === slug && !used.has(resource.type),
    );
    if (pick) {
      used.add(pick.type);
      picks.push(pick);
    }
  }
  for (const pick of picks) pick.featured = true;
  return picks;
}

export const FEATURED: Resource[] = pickFeatured();

export const resourceById = new Map(RESOURCES.map((resource) => [resource.id, resource]));

export function getResource(id: string): Resource | undefined {
  return resourceById.get(id);
}

export function resourcesByOffice(officeSlug: string): Resource[] {
  return RESOURCES.filter((resource) => resource.office === officeSlug);
}

export function officeCounts(): Map<string, number> {
  const counts = new Map<string, number>();
  for (const resource of RESOURCES) {
    counts.set(resource.office, (counts.get(resource.office) ?? 0) + 1);
  }
  return counts;
}

export function typeCounts(): Record<MediaType, number> {
  return RESOURCES.reduce(
    (acc, resource) => {
      acc[resource.type] += 1;
      return acc;
    },
    { book: 0, podcast: 0, video: 0, article: 0 } as Record<MediaType, number>,
  );
}

export function tagCounts(): Map<string, number> {
  const counts = new Map<string, number>();
  for (const resource of RESOURCES) {
    for (const tag of resource.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return counts;
}

export function featuredResources(): Resource[] {
  return FEATURED;
}

export { CATALOG };
export type { CatalogItem, MediaType };
