import type { MediaType } from "./catalog";
import type { Resource } from "./content";
import { TAGS, tagLabel } from "./tags";

/** "foryou" ranks for the person reading (or by the crowd for a visitor). */
export type SortKey = "foryou" | "trending" | "newest" | "title" | "office";

const SORT_KEYS: SortKey[] = ["foryou", "trending", "newest", "title", "office"];

export const MEDIA_TYPES: MediaType[] = ["book", "podcast", "video", "article"];

export interface Filters {
  query: string;
  types: MediaType[];
  tags: string[];
  office: string;
  sort: SortKey;
}

export const emptyFilters: Filters = {
  query: "",
  types: [],
  tags: [],
  office: "all",
  sort: "foryou",
};

function haystack(resource: Resource): string {
  return [
    resource.title,
    resource.creator,
    resource.blurb,
    ...resource.tags,
    ...resource.tags.map((tag) => tagLabel(tag)),
  ]
    .join(" ")
    .toLowerCase();
}

/**
 * Type, office and query combine with AND; multiple tags combine with OR
 * (any selected tag matches) so a multi-tag filter widens rather than empties.
 */
export function filterResources(
  resources: Resource[],
  filters: Filters,
): Resource[] {
  const query = filters.query.trim().toLowerCase();

  const filtered = resources.filter((resource) => {
    if (filters.office !== "all" && resource.office !== filters.office) return false;
    if (filters.types.length > 0 && !filters.types.includes(resource.type)) return false;
    if (
      filters.tags.length > 0 &&
      !filters.tags.some((tag) => (resource.tags as string[]).includes(tag))
    ) {
      return false;
    }
    if (query && !haystack(resource).includes(query)) return false;
    return true;
  });

  return sortResources(filtered, filters.sort);
}

/** Plain sorts. "foryou" and "trending" need engagement, so callers rank those. */
export function sortResources(resources: Resource[], sort: SortKey): Resource[] {
  const copy = [...resources];
  switch (sort) {
    case "foryou":
    case "trending":
      return copy;
    case "title":
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case "office":
      return copy.sort((a, b) => a.office.localeCompare(b.office) || a.title.localeCompare(b.title));
    case "newest":
    default:
      return copy.sort((a, b) => b.addedAt.localeCompare(a.addedAt) || a.title.localeCompare(b.title));
  }
}

/** Read filters from a query string; unknown values are ignored rather than trusted. */
export function parseFilters(params: URLSearchParams): Filters {
  const types = params
    .getAll("type")
    .flatMap((value) => value.split(","))
    .filter((value): value is MediaType => (MEDIA_TYPES as string[]).includes(value));
  const tags = params
    .getAll("tag")
    .flatMap((value) => value.split(","))
    .filter((value) => (TAGS as readonly string[]).includes(value));
  const sort = params.get("sort");
  return {
    query: params.get("q") ?? "",
    types,
    tags,
    office: params.get("office") ?? "all",
    sort: (SORT_KEYS as string[]).includes(sort ?? "") ? (sort as SortKey) : "foryou",
  };
}

export function toQueryString(filters: Filters): string {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set("q", filters.query.trim());
  if (filters.types.length) params.set("type", filters.types.join(","));
  if (filters.tags.length) params.set("tag", filters.tags.join(","));
  if (filters.office !== "all") params.set("office", filters.office);
  if (filters.sort !== "foryou") params.set("sort", filters.sort);
  return params.toString();
}

export function activeFilterCount(filters: Filters): number {
  return (
    filters.types.length +
    filters.tags.length +
    (filters.office !== "all" ? 1 : 0) +
    (filters.query.trim() ? 1 : 0)
  );
}
