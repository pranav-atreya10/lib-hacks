import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireMember } from "@/lib/auth";
import { companyLibraries, companyStats, libraryItems, personActivity, findItem } from "@/lib/library";
import { buildCards, monthLabel, currentMonth, relativeTime, trending } from "@/lib/insights";
import { assignments, coachingNotes, giveaways } from "@/lib/team";
import { q } from "@/lib/db";
import { ItemCard } from "@/components/item-card";
import { PageHeader, PageSkeleton } from "@/components/page-header";
import { Cover } from "@/components/cover";
import { ArrowRightIcon, CheckCircle2Icon, SparklesIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { TYPE_NOUN } from "@/lib/media";
import type { MediaType } from "@/lib/catalog";

export const metadata: Metadata = { title: "Home" };

const PLURAL: Record<MediaType, string> = { book: "books", podcast: "podcasts", video: "videos", article: "articles" };

async function Home() {
  const viewer = await requireMember();
  const { companyId, companyName, interests } = viewer.membership;
  const first = viewer.name.split(" ")[0];
  const libraries = (await companyLibraries(companyId, viewer.id)).filter((library) => library.myRole);
  const libraryIds = libraries.map((library) => library.id);
  const requests =
    viewer.membership.role === "admin"
      ? Number((await q<{ count: string | number }>("select count(*) as count from join_requests where company_id = $1", [companyId]))[0]?.count ?? 0)
      : 0;
  const [items, everything, stats, activity, assigned, notes, prizes] = await Promise.all([
    libraryItems(companyId, libraryIds),
    libraryItems(companyId),
    companyStats(companyId),
    personActivity(companyId, viewer.id),
    assignments({ memberId: viewer.id }, companyId),
    coachingNotes(viewer.id, companyId),
    giveaways(libraryIds),
  ]);

  // "Did you know": what arrived this month in your libraries, by kind.
  const month = currentMonth();
  const fresh = items.filter((item) => item.addedAt.slice(0, 7) === month);
  const pool = fresh.length ? fresh : items;
  const byType: Record<MediaType, number> = { book: 0, podcast: 0, video: 0, article: 0 };
  for (const item of pool) byType[item.type] += 1;
  const topType = (Object.keys(byType) as MediaType[]).sort((a, b) => byType[b] - byType[a])[0];

  const cards = buildCards(items, stats, interests, activity)
    .sort((a, b) => b.forYou - a.forYou)
    .slice(0, 6);
  const hot = trending(everything, stats).slice(0, 4);
  const open = assigned.filter((entry) => !entry.completedAt);
  const assignedItems = await Promise.all(open.slice(0, 4).map((entry) => findItem(companyId, entry.itemKey)));

  return (
    <div className="app-page grid grid-cols-1 gap-12">
      <PageHeader
        title={
          <>
            Hey {first}, did you know{" "}
            <span className="text-brand-ink">
              {byType[topType]} {PLURAL[topType]}
            </span>{" "}
            {fresh.length ? `were added this month?` : "are in your libraries?"}
          </>
        }
        description={`${items.length} files across ${libraries.length} ${libraries.length === 1 ? "library" : "libraries"} at ${companyName}, ranked for your interests and what colleagues like.`}
        actions={
          <Button asChild variant="outline">
            <Link href="/app/libraries">Browse libraries</Link>
          </Button>
        }
      />

      {requests ? (
        <Link
          href="/app/admin"
          className="flex items-center justify-between gap-3 rounded-xl bg-tint-blue px-5 py-4 text-sm text-tint-blue-ink hover:opacity-90"
        >
          <span>
            <strong className="font-semibold">
              {requests} {requests === 1 ? "person wants" : "people want"} to join {companyName}.
            </strong>{" "}
            Review in Company admin.
          </span>
          <ArrowRightIcon className="size-4" aria-hidden="true" />
        </Link>
      ) : null}

      {open.length || notes.length ? (
        <section aria-labelledby="from-leads" className="grid gap-4 lg:grid-cols-2">
          <h2 id="from-leads" className="sr-only">
            From your leads
          </h2>
          {open.length ? (
            <div className="surface p-6">
              <h3 className="text-sm font-semibold">Assigned to you</h3>
              <ul className="mt-4 grid gap-3">
                {open.slice(0, 4).map((entry, index) => {
                  const item = assignedItems[index];
                  if (!item) return null;
                  return (
                    <li key={entry.id}>
                      <Link href={`/app/items/${item.key}`} className="grid grid-cols-[5rem_1fr] items-center gap-3 rounded-lg p-1 hover:bg-muted">
                        <span className="overflow-hidden rounded-md">
                          <Cover item={item} />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{item.title}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            From {entry.leadName} · {entry.libraryName}
                            {entry.note ? ` — “${entry.note}”` : ""}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
          {notes.length ? (
            <div className="surface p-6">
              <h3 className="text-sm font-semibold">Notes from your leads</h3>
              <ul className="mt-4 grid gap-4">
                {notes.slice(0, 3).map((note) => (
                  <li key={note.id} className="text-sm">
                    <p className="leading-relaxed">{note.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {note.leadName} · {note.libraryName} · {relativeTime(note.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {prizes.length ? (
        <section aria-label="Giveaways" className="grid gap-3 sm:grid-cols-2">
          {prizes.map((prize) => (
            <div key={prize.libraryId} className="flex items-start gap-3 rounded-xl bg-tint-yellow p-5 text-tint-yellow-ink">
              {prize.winnerName ? (
                <CheckCircle2Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              ) : (
                <SparklesIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              )}
              <p className="text-sm">
                <strong className="font-semibold">{prize.libraryName} giveaway, {monthLabel(prize.month)}</strong>
                <br />
                {prize.winnerName
                  ? `${prize.winnerName === viewer.name ? "You" : prize.winnerName} won${prize.prize ? ` ${prize.prize}` : ""}.`
                  : `${prize.prize || "A prize"} — read, review and recommend to be picked.`}
              </p>
            </div>
          ))}
        </section>
      ) : null}

      <section aria-labelledby="for-you" className="grid gap-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="for-you" className="text-lg font-semibold tracking-tight">
              For you
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Your interests first, then what colleagues like and review.</p>
          </div>
        </div>
        {cards.length ? (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => (
              <li key={card.key}>
                <ItemCard card={card} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="grid place-items-center gap-3 rounded-xl border border-dashed border-border px-6 py-14 text-center">
            <p className="font-medium">Your libraries are empty so far.</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Add a collection from the marketplace, or join a library a colleague started.
            </p>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/app/marketplace">Open the marketplace</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/app/libraries">Find libraries</Link>
              </Button>
            </div>
          </div>
        )}
      </section>

      {hot.length ? (
        <section aria-labelledby="trending" className="grid gap-4">
          <div className="flex items-end justify-between gap-4">
            <h2 id="trending" className="text-lg font-semibold tracking-tight">
              Trending at {companyName}
            </h2>
            <Link href="/app/trends" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
              All trends <ArrowRightIcon className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
          <ol className="grid gap-2 sm:grid-cols-2">
            {hot.map((entry, index) => (
              <li key={entry.item.key}>
                <Link
                  href={`/app/items/${entry.item.key}`}
                  className="grid grid-cols-[1.25rem_5rem_1fr] items-center gap-3 rounded-lg border border-border bg-card p-2 pr-4 hover:bg-muted/60"
                >
                  <span className="text-center text-sm font-medium text-muted-foreground tabular-nums">{index + 1}</span>
                  <span className="overflow-hidden rounded-md">
                    <Cover item={entry.item} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{entry.item.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {TYPE_NOUN[entry.item.type]} · {entry.stats.likes} likes · {entry.stats.reviews} reviews
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Home />
    </Suspense>
  );
}
