import Link from "next/link";
import { Cover } from "@/components/cover";
import { Stat } from "@/components/page-header";
import { SparklesIcon } from "@/components/icons";
import type { Item } from "@/lib/library";
import type { PersonActivity } from "@/lib/library";
import type { PersonInsights, Ranked } from "@/lib/insights";
import { relativeTime } from "@/lib/insights";
import { tagLabel } from "@/lib/tags";

/** The same report a library admin sees about a person — shown to that person too. */
export function PersonReport({
  firstName,
  insights,
  activity,
  items,
  self,
}: {
  firstName: string;
  insights: PersonInsights;
  activity: PersonActivity;
  items: Item[];
  self: boolean;
}) {
  const byKey = new Map(items.map((item) => [item.key, item]));
  const maxTopic = insights.topTopics[0]?.count ?? 1;
  const timeline = [
    ...activity.viewRows.map((row) => ({ ...row, verb: "Opened" })),
    ...activity.likeRows.map((row) => ({ ...row, verb: "Liked" })),
    ...activity.reviews.map((row) => ({ key: row.key, at: row.at, verb: `Reviewed (${row.rating}★)` })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8);

  return (
    <div className="grid gap-6">
      <dl className="surface grid grid-cols-2 gap-6 p-6 sm:grid-cols-5">
        <Stat label="Reads, 30 days" value={insights.reads30} />
        <Stat label="Reads, all time" value={insights.readsTotal} />
        <Stat label="Likes" value={insights.likes} />
        <Stat label="Reviews" value={insights.reviews} />
        <Stat label="Last active" value={<span className="text-base">{relativeTime(insights.lastActive)}</span>} />
      </dl>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface p-6" aria-labelledby="topics">
          <h3 id="topics" className="text-sm font-semibold">
            Top topics
          </h3>
          {insights.topTopics.length ? (
            <ul className="mt-4 grid gap-2.5">
              {insights.topTopics.map((topic) => (
                <li key={topic.tag} className="grid grid-cols-[7rem_1fr_2rem] items-center gap-3 text-sm">
                  <span className="truncate text-muted-foreground">{tagLabel(topic.tag)}</span>
                  <span className="h-2 rounded-full bg-muted">
                    <span className="block h-full rounded-full bg-foreground/80" style={{ width: `${(topic.count / maxTopic) * 100}%` }} />
                  </span>
                  <span className="text-right text-xs tabular-nums">{topic.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Nothing opened yet.</p>
          )}
          {insights.blindSpots.length ? (
            <p className="mt-5 text-xs text-muted-foreground">
              Never opened: {insights.blindSpots.slice(0, 6).map(tagLabel).join(", ")}
            </p>
          ) : null}
        </section>

        <section className="surface p-6" aria-labelledby="prompts">
          <h3 id="prompts" className="text-sm font-semibold">
            {self ? "What your leads see" : "Coaching prompts"}
          </h3>
          <ul className="mt-4 grid gap-3">
            {insights.prompts.map((prompt) => (
              <li key={prompt} className="flex items-start gap-2 rounded-lg bg-tint-yellow px-3 py-2.5 text-sm text-tint-yellow-ink">
                <SparklesIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {prompt}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PickList title={self ? "Picked for you" : `Picked for ${firstName}`} entries={insights.forThem} empty="Nothing unread matches their interests." />
        <PickList title="Outside the bubble" entries={insights.stretch} empty="Nothing to stretch into yet." />
      </div>

      <section className="surface p-6" aria-labelledby="timeline">
        <h3 id="timeline" className="text-sm font-semibold">
          Recent activity
        </h3>
        {timeline.length ? (
          <ul className="mt-4 grid gap-2 text-sm">
            {timeline.map((entry, index) => (
              <li key={`${entry.key}-${entry.at}-${index}`} className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate">
                  <span className="text-muted-foreground">{entry.verb} </span>
                  <Link href={`/app/items/${entry.key}`} className="hover:underline">
                    {byKey.get(entry.key)?.title ?? "a file"}
                  </Link>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(entry.at)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No activity yet.</p>
        )}
      </section>
    </div>
  );
}

function PickList({ title, entries, empty }: { title: string; entries: Ranked[]; empty: string }) {
  return (
    <section className="surface p-6">
      <h3 className="text-sm font-semibold">{title}</h3>
      {entries.length ? (
        <ul className="mt-4 grid gap-2">
          {entries.map((entry) => (
            <li key={entry.item.key}>
              <Link href={`/app/items/${entry.item.key}`} className="grid grid-cols-[4.5rem_1fr] items-center gap-3 rounded-lg p-1 hover:bg-muted">
                <span className="overflow-hidden rounded-md">
                  <Cover item={entry.item} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{entry.item.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{entry.reason ?? entry.item.creator}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
      )}
    </section>
  );
}
