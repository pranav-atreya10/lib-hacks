import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireMember } from "@/lib/auth";
import { q } from "@/lib/db";
import { companyLibraries, companyStats, findItem, libraryItems } from "@/lib/library";
import { trending, requestTime } from "@/lib/insights";
import { monthScores, companyPeople } from "@/lib/team";
import { PageHeader, PageSkeleton, Stat } from "@/components/page-header";
import { Cover } from "@/components/cover";
import { UserAvatar } from "@/components/user-avatar";
import { TAGS, tagLabel, type TagId } from "@/lib/tags";
import { CATALOG } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Trends" };

const DAY = 86_400_000;

function delta(now: number, before: number): { label: string; up: boolean | null } {
  if (before === 0) return { label: now ? "new" : "—", up: now ? true : null };
  const change = Math.round(((now - before) / before) * 100);
  return { label: `${change > 0 ? "+" : ""}${change}%`, up: change === 0 ? null : change > 0 };
}

async function Trends() {
  const viewer = await requireMember();
  const { companyId, companyName } = viewer.membership;
  const [events, items, stats, libraries] = await Promise.all([
    q<{ item_key: string; user_id: string; kind: string; created_at: Date | string }>(
      `select item_key, user_id, 'view' as kind, created_at from views where company_id = $1 and created_at > now() - interval '60 days'
       union all select item_key, user_id, 'like', created_at from likes where company_id = $1 and created_at > now() - interval '60 days'
       union all select item_key, user_id, 'review', created_at from reviews where company_id = $1 and created_at > now() - interval '60 days'`,
      [companyId],
    ),
    libraryItems(companyId),
    companyStats(companyId),
    companyLibraries(companyId, viewer.id),
  ]);

  const now = requestTime();
  const age = (at: Date | string) => now - new Date(at).getTime();
  const week = events.filter((event) => age(event.created_at) < 7 * DAY);
  const lastWeek = events.filter((event) => age(event.created_at) >= 7 * DAY && age(event.created_at) < 14 * DAY);
  const count = (list: typeof events, kind: string) => list.filter((event) => event.kind === kind).length;

  // Activity per day, last 30 days.
  const days = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(now - (29 - index) * DAY);
    return { key: date.toISOString().slice(0, 10), label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), count: 0 };
  });
  const dayIndex = new Map(days.map((day, index) => [day.key, index]));
  for (const event of events) {
    const index = dayIndex.get(new Date(event.created_at).toISOString().slice(0, 10));
    if (index !== undefined) days[index].count += 1;
  }
  const maxDay = Math.max(1, ...days.map((day) => day.count));

  // Topics: this 30 days against the 30 before.
  const tagsOf = new Map<string, TagId[]>(items.map((item) => [item.key, item.tags]));
  for (const entry of CATALOG) if (!tagsOf.has(`c-${entry.slug}`)) tagsOf.set(`c-${entry.slug}`, entry.tags);
  const recent = new Map<TagId, number>();
  const earlier = new Map<TagId, number>();
  for (const event of events) {
    const bucket = age(event.created_at) < 30 * DAY ? recent : earlier;
    for (const tag of tagsOf.get(event.item_key) ?? []) bucket.set(tag, (bucket.get(tag) ?? 0) + 1);
  }
  const topics = TAGS.map((tag) => ({ tag, now: recent.get(tag) ?? 0, before: earlier.get(tag) ?? 0 }))
    .filter((topic) => topic.now || topic.before)
    .sort((a, b) => b.now - a.now);
  const rising = [...topics].filter((topic) => topic.now > topic.before).sort((a, b) => b.now - b.before - (a.now - a.before)).slice(0, 4);
  const quiet = TAGS.filter((tag) => !recent.has(tag) && items.some((item) => item.tags.includes(tag))).slice(0, 6);
  const maxTopic = Math.max(1, ...topics.map((topic) => topic.now));

  const top = trending(items, stats).slice(0, 5);
  const topItems = await Promise.all(top.map((entry) => findItem(companyId, entry.item.key)));

  // Libraries by activity on their shelves this month.
  const libraryActivity = libraries
    .map((library) => {
      const keys = new Set(items.filter((item) => item.libraries.some((entry) => entry.id === library.id)).map((item) => item.key));
      return { library, count: events.filter((event) => age(event.created_at) < 30 * DAY && keys.has(event.item_key)).length };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const isAdmin = viewer.membership.role === "admin";
  const people = isAdmin ? await companyPeople(companyId) : [];
  const scores = isAdmin ? await monthScores(companyId, people.map((person) => person.id)) : new Map<string, number>();
  const leaders = people
    .map((person) => ({ person, score: scores.get(person.id) ?? 0 }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const reads = delta(count(week, "view"), count(lastWeek, "view"));
  const likes = delta(count(week, "like"), count(lastWeek, "like"));
  const reviews = delta(count(week, "review"), count(lastWeek, "review"));
  const people7 = new Set(week.map((event) => event.user_id)).size;

  return (
    <div className="app-page grid grid-cols-1 gap-10">
      <PageHeader title="Trends" description={`What ${companyName} is reading, liking and reviewing.`} />

      <dl className="surface grid grid-cols-2 gap-6 p-6 sm:grid-cols-4">
        <Stat label="Reads this week" value={count(week, "view")} hint={<Delta {...reads} />} />
        <Stat label="Likes this week" value={count(week, "like")} hint={<Delta {...likes} />} />
        <Stat label="Reviews this week" value={count(week, "review")} hint={<Delta {...reviews} />} />
        <Stat label="People active this week" value={people7} />
      </dl>

      <section className="surface p-6" aria-labelledby="activity">
        <h2 id="activity" className="text-sm font-semibold">
          Activity, last 30 days
        </h2>
        <div className="mt-6 flex h-36 items-end gap-1" role="img" aria-label={`Daily activity over 30 days, peak ${maxDay}`}>
          {days.map((day) => (
            <div key={day.key} className="group relative flex h-full flex-1 items-end">
              <div
                className="w-full rounded-t-[3px] bg-foreground/75 transition-colors group-hover:bg-brand"
                style={{ height: `${Math.max(day.count ? 6 : 1, (day.count / maxDay) * 100)}%`, opacity: day.count ? 1 : 0.15 }}
              />
              <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 rounded bg-foreground px-1.5 py-0.5 text-[0.625rem] whitespace-nowrap text-background group-hover:block">
                {day.label}: {day.count}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{days[0].label}</span>
          <span>Today</span>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface p-6" aria-labelledby="topics">
          <h2 id="topics" className="text-sm font-semibold">
            Topics, last 30 days
          </h2>
          {topics.length ? (
            <ul className="mt-4 grid gap-2.5">
              {topics.slice(0, 8).map((topic) => {
                const change = delta(topic.now, topic.before);
                return (
                  <li key={topic.tag} className="grid grid-cols-[7.5rem_1fr_3.5rem] items-center gap-3 text-sm">
                    <span className="truncate text-muted-foreground">{tagLabel(topic.tag)}</span>
                    <span className="h-2 rounded-full bg-muted">
                      <span className="block h-full rounded-full bg-foreground/80" style={{ width: `${(topic.now / maxTopic) * 100}%` }} />
                    </span>
                    <span className="text-right text-xs">
                      <Delta {...change} />
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No activity yet. Trends appear as people read.</p>
          )}
        </section>
        <section className="surface grid content-start gap-5 p-6" aria-labelledby="movement">
          <h2 id="movement" className="text-sm font-semibold">
            Rising and quiet
          </h2>
          <div>
            <p className="text-xs text-muted-foreground">Rising</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {rising.length ? (
                rising.map((topic) => (
                  <span key={topic.tag} className="tag bg-tint-green text-tint-green-ink">
                    {tagLabel(topic.tag)}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Nothing yet.</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Nobody touched this month</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {quiet.length ? (
                quiet.map((tag) => (
                  <span key={tag} className="tag bg-tint-red text-tint-red-ink">
                    {tagLabel(tag)}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Every topic on the shelves got some attention.</span>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface p-6" aria-labelledby="top-files">
          <h2 id="top-files" className="text-sm font-semibold">
            Most popular files
          </h2>
          {top.length ? (
            <ol className="mt-4 grid gap-2">
              {top.map((entry, index) => {
                const item = topItems[index] ?? entry.item;
                return (
                  <li key={entry.item.key}>
                    <Link href={`/app/items/${item.key}`} className="grid grid-cols-[1.25rem_4.5rem_1fr] items-center gap-3 rounded-lg p-1 hover:bg-muted">
                      <span className="text-center text-sm text-muted-foreground tabular-nums">{index + 1}</span>
                      <span className="overflow-hidden rounded-md">
                        <Cover item={item} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{item.title}</span>
                        <span className="block text-xs text-muted-foreground tabular-nums">
                          {entry.stats.views} views · {entry.stats.likes} likes · {entry.stats.reviews} reviews
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Nothing yet.</p>
          )}
        </section>
        <section className="surface p-6" aria-labelledby="libraries">
          <h2 id="libraries" className="text-sm font-semibold">
            Most active libraries, 30 days
          </h2>
          <ul className="mt-4 grid gap-2">
            {libraryActivity.map(({ library, count: total }) => (
              <li key={library.id} className="flex items-center justify-between gap-3 text-sm">
                <Link href={`/app/libraries/${library.id}`} className="truncate hover:underline">
                  {library.name}
                </Link>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {total} actions · {library.members} members
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {isAdmin ? (
        <section className="surface p-6" aria-labelledby="contributors">
          <h2 id="contributors" className="text-sm font-semibold">
            Top contributors this month <span className="font-normal text-muted-foreground">· visible to company admins</span>
          </h2>
          {leaders.length ? (
            <ol className="mt-4 grid gap-2.5">
              {leaders.map(({ person, score }, index) => (
                <li key={person.id} className="flex items-center gap-3 text-sm">
                  <span className="w-4 text-muted-foreground tabular-nums">{index + 1}</span>
                  <UserAvatar name={person.name} seed={person.id} size="xs" />
                  <span className="flex-1 truncate">{person.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{score} pts</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No activity this month yet.</p>
          )}
        </section>
      ) : null}
    </div>
  );
}

function Delta({ label, up }: { label: string; up: boolean | null }) {
  return (
    <span className={cn("tabular-nums", up === true && "text-tint-green-ink", up === false && "text-tint-red-ink")}>
      {label}
      {label !== "—" && label !== "new" ? " vs last" : ""}
    </span>
  );
}

export default function TrendsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Trends />
    </Suspense>
  );
}
