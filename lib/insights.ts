import type { Item, ItemStats, PersonActivity } from "./library";
import { EMPTY_STATS } from "./library";
import { TAGS, tagLabel, type TagId } from "./tags";

export interface Ranked {
  item: Item;
  stats: ItemStats;
  score: number;
  reason: string | null;
}

/** How much the company likes a file: likes most, reviews next, views least. */
export function crowdScore(stats: ItemStats): number {
  return (
    1.2 * Math.log2(1 + stats.likes) +
    0.5 * Math.log2(1 + stats.views) +
    0.8 * Math.min(stats.reviews, 8) +
    1.5 * stats.likesWeek +
    0.3 * stats.viewsWeek
  );
}

/** A person's ranking: their interests first, then the crowd, then freshness. */
export function rankForPerson(
  items: Item[],
  stats: Map<string, ItemStats>,
  interests: TagId[],
  activity?: Pick<PersonActivity, "likes" | "viewed">,
): Ranked[] {
  const now = Date.now();
  return items
    .map((item) => {
      const itemStats = stats.get(item.key) ?? EMPTY_STATS;
      const matches = item.tags.filter((tag) => interests.includes(tag));
      let score = matches.length * 10 + crowdScore(itemStats);
      const ageDays = (now - new Date(item.addedAt).getTime()) / 86_400_000;
      if (ageDays < 14) score += 3;
      if (activity?.viewed.has(item.key)) score -= 6;
      let reason: string | null = null;
      if (matches.length) reason = `Matches ${matches.map(tagLabel).join(" & ")}`;
      else if (itemStats.likesWeek > 0) reason = "Trending this week";
      else if (itemStats.likes > 0) reason = `${itemStats.likes} like${itemStats.likes === 1 ? "" : "s"} here`;
      return { item, stats: itemStats, score, reason };
    })
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title));
}

/** What the company is reading right now. */
export function trending(items: Item[], stats: Map<string, ItemStats>): Ranked[] {
  return items
    .map((item) => {
      const itemStats = stats.get(item.key) ?? EMPTY_STATS;
      return {
        item,
        stats: itemStats,
        score: crowdScore(itemStats),
        reason: itemStats.likesWeek + itemStats.viewsWeek > 0 ? "Active this week" : null,
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
}

export interface TopicCount {
  tag: TagId;
  count: number;
}

function countTopics(items: Item[], keys: string[]): TopicCount[] {
  const byKey = new Map(items.map((item) => [item.key, item]));
  const counts = new Map<TagId, number>();
  for (const key of keys) {
    for (const tag of byKey.get(key)?.tags ?? []) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export interface PersonInsights {
  reads30: number;
  readsTotal: number;
  likes: number;
  reviews: number;
  lastActive: string | null;
  topTopics: TopicCount[];
  /** Topics in the library this person has never opened. */
  blindSpots: TagId[];
  /** Unread files that match their interests. */
  forThem: Ranked[];
  /** Well-liked files outside their interests: the stretch picks. */
  stretch: Ranked[];
  prompts: string[];
}

const DAY = 86_400_000;

export function personInsights(
  name: string,
  items: Item[],
  stats: Map<string, ItemStats>,
  interests: TagId[],
  activity: PersonActivity,
  self = false,
): PersonInsights {
  const now = Date.now();
  const first = name.split(" ")[0];
  const reads30 = activity.viewRows.filter((row) => now - new Date(row.at).getTime() < 30 * DAY).length;
  const timestamps = [
    ...activity.viewRows.map((row) => row.at),
    ...activity.likeRows.map((row) => row.at),
    ...activity.reviews.map((row) => row.at),
  ].sort();
  const lastActive = timestamps.at(-1) ?? null;
  const engagedKeys = [
    ...new Set([...activity.viewed, ...activity.likes, ...activity.reviews.map((row) => row.key)]),
  ];
  const topTopics = countTopics(items, engagedKeys);
  const libraryTopics = new Set(items.flatMap((item) => item.tags));
  const touched = new Set(topTopics.map((topic) => topic.tag));
  const blindSpots = TAGS.filter((tag) => libraryTopics.has(tag) && !touched.has(tag));

  const ranked = rankForPerson(items, stats, interests, activity).filter(
    (entry) => !activity.viewed.has(entry.item.key),
  );
  const forThem = ranked.filter((entry) => entry.item.tags.some((tag) => interests.includes(tag))).slice(0, 3);
  const stretch = trending(items, stats)
    .concat(ranked)
    .filter(
      (entry, index, all) =>
        !entry.item.tags.some((tag) => interests.includes(tag)) &&
        !activity.viewed.has(entry.item.key) &&
        all.findIndex((other) => other.item.key === entry.item.key) === index,
    )
    .slice(0, 3);

  const prompts: string[] = [];
  const idleDays = lastActive ? Math.floor((now - new Date(lastActive).getTime()) / DAY) : null;
  const they = self ? "You" : first;
  if (idleDays === null) {
    prompts.push(self ? "You haven't opened anything yet — start with something picked for you." : `${first} hasn't opened anything yet. Assign a short first read.`);
  } else if (idleDays >= 14) {
    prompts.push(self ? `You haven't been active for ${idleDays} days.` : `${first} hasn't been active for ${idleDays} days. A quick check-in could help.`);
  }
  if (topTopics.length > 0 && topTopics.length <= 2 && engagedKeys.length >= 3) {
    const topics = topTopics.map((topic) => tagLabel(topic.tag)).join(" and ");
    const stretchTopic = blindSpots[0] ? tagLabel(blindSpots[0]) : "another topic";
    prompts.push(self ? `You mostly read ${topics}. Try something from ${stretchTopic}.` : `${first} mostly reads ${topics}. Suggest something from ${stretchTopic} to widen it.`);
  }
  if (activity.viewRows.length >= 5 && activity.reviews.length === 0) {
    prompts.push(self ? "You read a lot but haven't reviewed anything yet." : `${first} reads a lot but hasn't reviewed anything. Ask what stuck with them.`);
  }
  if (activity.reviews.length >= 3) prompts.push(`${they} review${self ? "" : "s"} often — a natural pick to run a library.`);
  if (prompts.length === 0) prompts.push(self ? "You're on a good rhythm." : `${first} is on a good rhythm. Recognise it in your next 1:1.`);

  return {
    reads30,
    readsTotal: activity.viewRows.length,
    likes: activity.likes.size,
    reviews: activity.reviews.length,
    lastActive,
    topTopics: topTopics.slice(0, 5),
    blindSpots,
    forThem,
    stretch,
    prompts,
  };
}

export function relativeTime(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function currentMonth(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(month: string): string {
  const [year, value] = month.split("-").map(Number);
  return new Date(Date.UTC(year, value - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Everything a file card needs, ready to send to the browser. */
export interface CardData extends Item {
  stats: ItemStats;
  liked: boolean;
  forYou: number;
  trend: number;
  reason: string | null;
}

export function buildCards(
  items: Item[],
  stats: Map<string, ItemStats>,
  interests: TagId[],
  activity: Pick<PersonActivity, "likes" | "viewed">,
): CardData[] {
  const ranked = new Map(rankForPerson(items, stats, interests, activity).map((entry) => [entry.item.key, entry]));
  return items.map((item) => {
    const entry = ranked.get(item.key);
    const itemStats = stats.get(item.key) ?? EMPTY_STATS;
    return {
      ...item,
      stats: itemStats,
      liked: activity.likes.has(item.key),
      forYou: entry?.score ?? 0,
      trend: crowdScore(itemStats),
      reason: entry?.reason ?? null,
    };
  });
}

/** The request's clock. Server pages render per request, so this is the time of the visit. */
export function requestTime(): number {
  return Date.now();
}
