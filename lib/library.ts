import "server-only";
import { CATALOG } from "./catalog";
import { COLLECTIONS, collectionItems } from "./marketplace";
import { q } from "./db";
import type { MediaType } from "./catalog";
import type { TagId } from "./tags";

/** A file in a library: from a marketplace collection, or recommended by a person. */
export interface Item {
  key: string;
  slug: string;
  title: string;
  creator: string;
  type: MediaType;
  tags: TagId[];
  length: string;
  url: string;
  blurb: string;
  source: "catalog" | "custom";
  addedBy: { id: string; name: string } | null;
  addedAt: string;
  libraries: { id: string; name: string }[];
}

export interface ItemStats {
  views: number;
  likes: number;
  reviews: number;
  rating: number;
  viewsWeek: number;
  likesWeek: number;
}

export const EMPTY_STATS: ItemStats = {
  views: 0,
  likes: 0,
  reviews: 0,
  rating: 0,
  viewsWeek: 0,
  likesWeek: 0,
};

export function catalogKey(slug: string): string {
  return `c-${slug}`;
}

export function customKey(id: string): string {
  return `i-${id}`;
}

export interface LibrarySummary {
  id: string;
  name: string;
  description: string;
  visibility: "open" | "private";
  createdAt: string;
  members: number;
  /** The viewer's role here, or null if they're not in it. */
  myRole: "admin" | "member" | null;
  collections: string[];
}

/** Every library in the company the viewer can see: open ones, and private ones they're in. */
export async function companyLibraries(companyId: string, userId: string): Promise<LibrarySummary[]> {
  const rows = await q<{
    id: string;
    name: string;
    description: string;
    visibility: "open" | "private";
    created_at: Date | string;
    members: string | number;
    my_role: "admin" | "member" | null;
    collections: string[] | null;
  }>(
    `select l.id, l.name, l.description, l.visibility, l.created_at,
            (select count(*) from library_members m where m.library_id = l.id) as members,
            (select role from library_members m where m.library_id = l.id and m.user_id = $2) as my_role,
            (select array_agg(collection_key) from library_collections c where c.library_id = l.id) as collections
       from libraries l
      where l.company_id = $1
        and (l.visibility = 'open'
             or exists (select 1 from library_members m where m.library_id = l.id and m.user_id = $2))
      order by l.created_at asc`,
    [companyId, userId],
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    visibility: row.visibility,
    createdAt: new Date(row.created_at).toISOString(),
    members: Number(row.members),
    myRole: row.my_role,
    collections: row.collections ?? [],
  }));
}

/** Items in the given libraries (all libraries in the company when omitted), newest first. */
export async function libraryItems(companyId: string, libraryIds?: string[]): Promise<Item[]> {
  const scoped = libraryIds !== undefined;
  if (scoped && libraryIds.length === 0) return [];
  const [collections, custom, extraTags] = await Promise.all([
    q<{ library_id: string; library_name: string; collection_key: string; added_at: Date | string }>(
      `select c.library_id, l.name as library_name, c.collection_key, c.added_at
         from library_collections c join libraries l on l.id = c.library_id
        where l.company_id = $1 ${scoped ? "and c.library_id = any($2)" : ""}`,
      scoped ? [companyId, libraryIds] : [companyId],
    ),
    q<{
      id: string;
      library_id: string;
      library_name: string;
      title: string;
      creator: string;
      type: MediaType;
      url: string;
      blurb: string;
      length: string;
      tags: string[];
      created_at: Date | string;
      added_by: string | null;
      added_by_name: string | null;
    }>(
      `select i.*, l.name as library_name, u.name as added_by_name
         from items i
         join libraries l on l.id = i.library_id
         left join users u on u.id = i.added_by
        where i.company_id = $1 ${scoped ? "and i.library_id = any($2)" : ""}`,
      scoped ? [companyId, libraryIds] : [companyId],
    ),
    q<{ item_key: string; tag: string }>("select item_key, tag from item_tags where company_id = $1", [
      companyId,
    ]),
  ]);

  const byKey = new Map<string, Item>();
  const addLibrary = (item: Item, id: string, name: string) => {
    if (!item.libraries.some((library) => library.id === id)) item.libraries.push({ id, name });
  };

  for (const row of collections) {
    const collection = COLLECTIONS.find((entry) => entry.key === row.collection_key);
    if (!collection) continue;
    const addedAt = new Date(row.added_at).toISOString();
    for (const entry of collectionItems(collection)) {
      const key = catalogKey(entry.slug);
      let item = byKey.get(key);
      if (!item) {
        item = {
          key,
          slug: entry.slug,
          title: entry.title,
          creator: entry.creator,
          type: entry.type,
          tags: [...entry.tags],
          length: entry.length,
          url: entry.url,
          blurb: entry.blurb,
          source: "catalog",
          addedBy: null,
          addedAt,
          libraries: [],
        };
        byKey.set(key, item);
      } else if (addedAt < item.addedAt) {
        item.addedAt = addedAt;
      }
      addLibrary(item, row.library_id, row.library_name);
    }
  }

  for (const row of custom) {
    const key = customKey(row.id);
    byKey.set(key, {
      key,
      slug: row.id,
      title: row.title,
      creator: row.creator,
      type: row.type,
      tags: row.tags as TagId[],
      length: row.length || "Open-ended",
      url: row.url,
      blurb: row.blurb,
      source: "custom",
      addedBy: row.added_by ? { id: row.added_by, name: row.added_by_name ?? "" } : null,
      addedAt: new Date(row.created_at).toISOString(),
      libraries: [{ id: row.library_id, name: row.library_name }],
    });
  }

  for (const { item_key, tag } of extraTags) {
    const item = byKey.get(item_key);
    if (item && !item.tags.includes(tag as TagId)) item.tags.push(tag as TagId);
  }

  return [...byKey.values()].sort(
    (a, b) => b.addedAt.localeCompare(a.addedAt) || a.title.localeCompare(b.title),
  );
}

/** One item by key: from the company's libraries, or straight from the catalogue. */
export async function findItem(companyId: string, key: string): Promise<Item | null> {
  const found = (await libraryItems(companyId)).find((item) => item.key === key);
  if (found) return found;
  if (key.startsWith("c-")) {
    const entry = CATALOG.find((item) => item.slug === key.slice(2));
    if (entry) {
      return {
        key,
        slug: entry.slug,
        title: entry.title,
        creator: entry.creator,
        type: entry.type,
        tags: [...entry.tags],
        length: entry.length,
        url: entry.url,
        blurb: entry.blurb,
        source: "catalog",
        addedBy: null,
        addedAt: new Date().toISOString(),
        libraries: [],
      };
    }
  }
  return null;
}

/** Views, likes, reviews and ratings for every item the company touched. */
export async function companyStats(companyId: string): Promise<Map<string, ItemStats>> {
  const [views, likes, reviews] = await Promise.all([
    q<{ item_key: string; total: string | number; week: string | number }>(
      `select item_key, count(*) as total,
              count(*) filter (where created_at > now() - interval '7 days') as week
         from views where company_id = $1 group by item_key`,
      [companyId],
    ),
    q<{ item_key: string; total: string | number; week: string | number }>(
      `select item_key, count(*) as total,
              count(*) filter (where created_at > now() - interval '7 days') as week
         from likes where company_id = $1 group by item_key`,
      [companyId],
    ),
    q<{ item_key: string; total: string | number; rating: string | number }>(
      `select item_key, count(*) as total, avg(rating) as rating
         from reviews where company_id = $1 group by item_key`,
      [companyId],
    ),
  ]);
  const stats = new Map<string, ItemStats>();
  const get = (key: string) => {
    let entry = stats.get(key);
    if (!entry) {
      entry = { ...EMPTY_STATS };
      stats.set(key, entry);
    }
    return entry;
  };
  for (const row of views) {
    const entry = get(row.item_key);
    entry.views = Number(row.total);
    entry.viewsWeek = Number(row.week);
  }
  for (const row of likes) {
    const entry = get(row.item_key);
    entry.likes = Number(row.total);
    entry.likesWeek = Number(row.week);
  }
  for (const row of reviews) {
    const entry = get(row.item_key);
    entry.reviews = Number(row.total);
    entry.rating = Number(row.rating);
  }
  return stats;
}

/** What one person has done in their company. */
export async function personActivity(companyId: string, userId: string) {
  const [likes, views, reviews] = await Promise.all([
    q<{ item_key: string; created_at: Date | string }>(
      "select item_key, created_at from likes where company_id = $1 and user_id = $2",
      [companyId, userId],
    ),
    q<{ item_key: string; created_at: Date | string }>(
      "select item_key, created_at from views where company_id = $1 and user_id = $2 order by created_at desc",
      [companyId, userId],
    ),
    q<{ item_key: string; rating: number; body: string; created_at: Date | string }>(
      "select item_key, rating, body, created_at from reviews where company_id = $1 and user_id = $2 order by created_at desc",
      [companyId, userId],
    ),
  ]);
  return {
    likes: new Set(likes.map((row) => row.item_key)),
    likeRows: likes.map((row) => ({ key: row.item_key, at: new Date(row.created_at).toISOString() })),
    viewed: new Set(views.map((row) => row.item_key)),
    viewRows: views.map((row) => ({ key: row.item_key, at: new Date(row.created_at).toISOString() })),
    reviews: reviews.map((row) => ({
      key: row.item_key,
      rating: row.rating,
      body: row.body,
      at: new Date(row.created_at).toISOString(),
    })),
  };
}

export type PersonActivity = Awaited<ReturnType<typeof personActivity>>;
