"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRightIcon, TrendingUpIcon } from "@/components/icons";
import { useLibraryState } from "@/components/library-state";
import { ResourceDialog } from "@/components/resource-card";
import { Cover } from "@/components/cover";
import { tagLabel } from "@/lib/tags";
import { TYPE_NOUN } from "@/lib/media";
import type { MediaType } from "@/lib/catalog";

const PLURAL: Record<MediaType, string> = {
  book: "books",
  podcast: "podcasts",
  video: "videos",
  article: "articles",
};

/** Files added on or after this date count as "new this season". */
const SEASON_START = "2026-09-01";

/**
 * "Hey, did you know…" — the numbers change with what is on the shelves, and
 * the picks underneath are ranked for whoever is reading: interests and office
 * first, then likes, reviews and views from everyone.
 */
export function LibraryDashboard() {
  const { persona, allResources, ranked, stats } = useLibraryState();

  const facts = useMemo(() => {
    const byType: Record<MediaType, number> = { book: 0, podcast: 0, video: 0, article: 0 };
    let recent = 0;
    let recentForYou = 0;
    let views = 0;
    let likes = 0;
    let reviews = 0;
    for (const resource of allResources) {
      byType[resource.type] += 1;
      const live = stats(resource);
      views += live.views;
      likes += live.likes;
      reviews += live.reviews;
      if (resource.addedAt >= SEASON_START) {
        recent += 1;
        if (persona && resource.tags.some((tag) => persona.interests.includes(tag))) {
          recentForYou += 1;
        }
      }
    }
    const top = (Object.keys(byType) as MediaType[]).sort((a, b) => byType[b] - byType[a])[0];
    return { byType, top, recent, recentForYou, views, likes, reviews };
  }, [allResources, persona, stats]);

  const picks = useMemo(() => ranked().slice(0, 3), [ranked]);
  const first = persona?.name.split(" ")[0];

  return (
    <section
      aria-labelledby="dashboard-heading"
      data-tour="dashboard"
      className="surface overflow-hidden"
    >
      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-12">
        <div className="flex flex-col">
          <h2
            id="dashboard-heading"
            className="text-2xl leading-snug font-semibold tracking-tight sm:text-[1.75rem]"
          >
            Hey {first ?? "there"}, did you know{" "}
            <em className="text-brand-ink not-italic">
              {facts.byType[facts.top]} {PLURAL[facts.top]}
            </em>{" "}
            were added?
          </h2>
          <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-muted-foreground">
            {facts.recent} files arrived since September
            {persona && facts.recentForYou > 0
              ? ` — ${facts.recentForYou} of them in ${persona.interests
                  .map((tag) => tagLabel(tag))
                  .join(", ")}.`
              : "."}{" "}
            {facts.byType.book} books, {facts.byType.podcast} podcasts and{" "}
            {facts.byType.video} videos sit alongside them.
          </p>

          <dl className="mt-auto grid grid-cols-3 gap-4 border-t border-border pt-6">
            <Stat label="Views" value={facts.views} />
            <Stat label="Likes" value={facts.likes} />
            <Stat label="Reviews" value={facts.reviews} />
          </dl>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-[0.9375rem] font-semibold">
              {persona ? `Top of ${first}'s ranking` : "Trending across the company"}
            </h3>
            {persona ? (
              <Link
                href={`/people/${persona.id}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Full ranking
                <ArrowRightIcon className="size-3.5" aria-hidden="true" />
              </Link>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {persona
              ? "Ranked by interests and office, then likes, reviews and views."
              : "Ranked by likes, reviews and views. Pick a person to make it yours."}
          </p>

          <ol className="mt-4 grid gap-2">
            {picks.map((entry, index) => (
              <li key={entry.resource.id}>
                <ResourceDialog resource={entry.resource}>
                  <button
                    type="button"
                    className="press group grid w-full grid-cols-[1.5rem_6rem_minmax(0,1fr)] items-center gap-4 rounded-xl p-2 text-left hover:bg-muted/70"
                  >
                    <span className="text-center text-sm font-medium text-muted-foreground tabular-nums">
                      {index + 1}
                    </span>
                    <span className="overflow-hidden rounded-lg">
                      <Cover item={entry.resource} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{entry.resource.title}</span>
                      <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                        {TYPE_NOUN[entry.resource.type]} · {entry.resource.creator}
                      </span>
                      {entry.reasons[0] ? (
                        <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-ink">
                          {entry.reasons[0].startsWith("Trending") ? (
                            <TrendingUpIcon className="size-3" aria-hidden="true" />
                          ) : null}
                          {entry.reasons[0]}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </ResourceDialog>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-xl font-semibold tabular-nums">{value.toLocaleString("en-US")}</dd>
    </div>
  );
}
