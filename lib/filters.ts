import type { MediaType } from "./catalog";
import { tagLabel, type TagId } from "./tags";

export type SortKey = "foryou" | "trending" | "newest" | "title";

export const MEDIA_TYPES: MediaType[] = ["book", "podcast", "video", "article"];

export interface Filters {
  query: string;
  types: MediaType[];
  tags: string[];
  sort: SortKey;
}

export const emptyFilters: Filters = { query: "", types: [], tags: [], sort: "foryou" };

/** The fields filtering needs; ranking scores are worked out on the server. */
export interface Filterable {
  key: string;
  title: string;
  creator: string;
  blurb: string;
  type: MediaType;
  tags: TagId[];
  addedAt: string;
  forYou: number;
  trend: number;
}

/** Types, tags and search combine with AND; several tags widen with OR. */
export function applyFilters<T extends Filterable>(items: T[], filters: Filters): T[] {
  const query = filters.query.trim().toLowerCase();
  const filtered = items.filter((item) => {
    if (filters.types.length && !filters.types.includes(item.type)) return false;
    if (filters.tags.length && !filters.tags.some((tag) => (item.tags as string[]).includes(tag))) return false;
    if (query) {
      const haystack = [item.title, item.creator, item.blurb, ...item.tags, ...item.tags.map(tagLabel)]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
  const sorted = [...filtered];
  switch (filters.sort) {
    case "trending":
      return sorted.sort((a, b) => b.trend - a.trend || b.addedAt.localeCompare(a.addedAt));
    case "newest":
      return sorted.sort((a, b) => b.addedAt.localeCompare(a.addedAt) || a.title.localeCompare(b.title));
    case "title":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return sorted.sort((a, b) => b.forYou - a.forYou || a.title.localeCompare(b.title));
  }
}

export function activeFilterCount(filters: Filters): number {
  return filters.types.length + filters.tags.length + (filters.query.trim() ? 1 : 0);
}
