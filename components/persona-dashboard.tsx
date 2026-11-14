"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  EyeIcon,
  MessageSquareIcon,
  PlusIcon,
  SparklesIcon,
  TrendingUpIcon,
} from "lucide-react";
import { useLibraryState } from "@/components/library-state";
import { PersonaAvatar } from "@/components/persona-avatar";
import { LikeButton, ResourceDialog } from "@/components/resource-card";
import { RecommendDialog } from "@/components/recommend-dialog";
import { Cover } from "@/components/cover";
import { RESOURCES } from "@/lib/content";
import { getPersona, type Persona } from "@/lib/personas";
import { officeBySlug, offices } from "@/lib/offices";
import { emptyEngagement, outsideBubble, type RankedResource } from "@/lib/personalize";
import { tagLabel } from "@/lib/tags";
import { TYPE_NOUN } from "@/lib/media";
import { Button } from "@/components/ui/button";

const VISIBLE_ROWS = 10;

export function PersonaDashboard({ personaId }: { personaId: string }) {
  const { persona, setPersonaId, people, allResources, rankedFor, stats } = useLibraryState();
  const owner = getPersona(personaId);
  const isSelf = persona?.id === personaId;

  const [showAll, setShowAll] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const ownerEngagement = people[personaId] ?? emptyEngagement;
  const shelf = useMemo(() => (owner ? rankedFor(owner) : []), [owner, rankedFor]);
  const bubble = useMemo(() => (owner ? outsideBubble(owner, RESOURCES, 3) : []), [owner]);

  if (!owner) {
    return (
      <div className="page-shell py-16 text-sm text-muted-foreground">
        That shelf doesn&rsquo;t exist yet.{" "}
        <Link href="/people" className="text-brand-ink underline">
          See all people
        </Link>
        .
      </div>
    );
  }

  const office = officeBySlug.get(owner.office);
  const rows = showAll ? shelf : shelf.slice(0, VISIBLE_ROWS);
  const first = owner.name.split(" ")[0];
  const articles = allResources.filter((resource) => resource.type === "article").length;
  const books = allResources.filter((resource) => resource.type === "book").length;
  const added = allResources.filter((resource) =>
    ownerEngagement.added.some((item) => item.id === resource.id),
  );
  const viewed = Object.values(ownerEngagement.views).reduce((total, count) => total + count, 0);

  return (
    <div className="page-shell grid grid-cols-1 gap-12 py-10 sm:py-14">
      {isSelf ? null : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl bg-muted px-4 py-3 text-sm">
          <PersonaAvatar persona={persona} size="xs" />
          <span>
            {persona ? (
              <>
                You&rsquo;re reading <strong>{owner.name}</strong>&rsquo;s shelf as{" "}
                <strong>{persona.name}</strong>.
              </>
            ) : (
              <>
                You&rsquo;re a visitor reading <strong>{owner.name}</strong>&rsquo;s shelf.
              </>
            )}
          </span>
          <Button size="sm" variant="outline" className="ml-auto" onClick={() => setPersonaId(owner.id)}>
            Read as {first}
          </Button>
        </div>
      )}

      <PersonaHeader persona={owner} officeName={office?.name ?? ""} />

      <section className="surface grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div>
          <p className="font-display text-[1.75rem] leading-[1.15] sm:text-[2.125rem]">
            Hey {first}, did you know{" "}
            <em className="text-brand-ink">{articles} articles</em> and{" "}
            <em className="text-brand-ink">{books} books</em> were added across{" "}
            {offices.length} offices?
          </p>
          <p className="mt-3 text-[0.9375rem] text-muted-foreground">
            Ranked for {owner.interests.map((tag) => tagLabel(tag)).join(", ")} and the{" "}
            {office?.city} office, then by everyone&rsquo;s likes, reviews and views.
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 self-end">
          <Metric label="Views logged" value={viewed} />
          <Metric label="Likes given" value={ownerEngagement.likes.length} />
          <Metric label="Reviews written" value={ownerEngagement.reviews.length} />
          <Metric label="Files recommended" value={ownerEngagement.added.length} />
        </dl>
      </section>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section aria-labelledby="shelf-heading">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="shelf-heading" className="text-lg font-semibold">
                {first}&rsquo;s shelf, ranked
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {shelf.length} files · {owner.traits.join(" · ")}
              </p>
            </div>
            {isSelf ? (
              <RecommendDialog onAdded={setJustAdded}>
                <Button variant="outline" size="sm">
                  <PlusIcon className="size-4" aria-hidden="true" />
                  Recommend
                </Button>
              </RecommendDialog>
            ) : null}
          </div>

          {justAdded ? (
            <p
              role="status"
              className="rise-in mt-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-800 dark:text-emerald-300"
            >
              <CheckCircle2Icon className="size-4 shrink-0" aria-hidden="true" />
              <span>
                <strong className="font-semibold">{justAdded}</strong> is on the {office?.city}{" "}
                shelf and at the top of your ranking.
              </span>
            </p>
          ) : null}

          <ol className="mt-5 grid gap-2">
            {rows.map((entry, index) => (
              <ShelfRow key={entry.resource.id} entry={entry} rank={index + 1} />
            ))}
          </ol>

          {shelf.length > VISIBLE_ROWS ? (
            <Button variant="ghost" className="mt-3" onClick={() => setShowAll((value) => !value)}>
              {showAll ? "Show fewer" : `Show all ${shelf.length} ranked files`}
            </Button>
          ) : null}
        </section>

        <aside className="grid content-start gap-10">
          <section aria-labelledby="bubble-heading" className="surface p-6">
            <div className="flex items-center gap-2">
              <SparklesIcon className="size-4 text-ember" aria-hidden="true" />
              <h2 id="bubble-heading" className="text-[0.9375rem] font-semibold">
                Outside {isSelf ? "your" : `${first}'s`} bubble
              </h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              What people unlike {isSelf ? "you" : first} rank highly — files{" "}
              {isSelf ? "your" : "their"} tags never touch. Push out of your comfort zone, unlike
              social media.
            </p>
            <ul className="mt-5 grid gap-4">
              {bubble.map(({ persona: other, entry }) => (
                <li key={`${entry.resource.id}-${other.id}`}>
                  <ResourceDialog resource={entry.resource}>
                    <button
                      type="button"
                      className="press grid w-full grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-3 rounded-xl text-left"
                    >
                      <span className="overflow-hidden rounded-lg">
                        <Cover item={entry.resource} />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <PersonaAvatar persona={other} size="xs" />
                          {other.name.split(" ")[0]}&rsquo;s pick
                        </span>
                        <span className="mt-1 block truncate text-sm font-medium">
                          {entry.resource.title}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {tagLabel(entry.resource.tags[0])} · {TYPE_NOUN[entry.resource.type]}
                        </span>
                      </span>
                    </button>
                  </ResourceDialog>
                </li>
              ))}
            </ul>
          </section>

          {added.length > 0 ? (
            <section aria-labelledby="added-heading">
              <h2 id="added-heading" className="text-[0.9375rem] font-semibold">
                {isSelf ? "Your" : `${first}'s`} recommendations
              </h2>
              <ul className="mt-3 grid gap-2">
                {added.map((resource) => {
                  const live = stats(resource);
                  return (
                    <li key={resource.id}>
                      <ResourceDialog resource={resource}>
                        <button
                          type="button"
                          className="press flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm hover:bg-muted/60"
                        >
                          <span className="min-w-0 truncate font-medium">{resource.title}</span>
                          <span className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground tabular-nums">
                            <span className="inline-flex items-center gap-1">
                              <EyeIcon className="size-3.5" aria-hidden="true" />
                              {live.views}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MessageSquareIcon className="size-3.5" aria-hidden="true" />
                              {live.reviews}
                            </span>
                          </span>
                        </button>
                      </ResourceDialog>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          <Link
            href="/people"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            See everyone&rsquo;s shelves
            <ArrowRightIcon className="size-3.5" aria-hidden="true" />
          </Link>
        </aside>
      </div>
    </div>
  );
}

function PersonaHeader({ persona, officeName }: { persona: Persona; officeName: string }) {
  const office = officeBySlug.get(persona.office);
  return (
    <header className="flex flex-wrap items-start justify-between gap-8">
      <div className="flex items-start gap-5">
        <PersonaAvatar persona={persona} size="lg" />
        <div>
          <h1 className="font-display text-[2.75rem] leading-none sm:text-[3.25rem]">
            {persona.name}
          </h1>
          <p className="mt-2 text-[0.9375rem] text-muted-foreground">
            {persona.age} · {persona.role} ·{" "}
            <Link href={`/offices/${persona.office}`} className="underline-offset-4 hover:underline">
              {officeName}, {office?.state}
            </Link>
          </p>
          <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-muted-foreground">
            {persona.blurb}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {persona.traits.map((trait) => (
              <span key={trait} className="rounded-full border border-border px-3 py-1 text-xs">
                {trait}
              </span>
            ))}
            {persona.interests.map((tag) => (
              <span key={tag} className="rounded-full bg-brand/10 px-3 py-1 text-xs text-brand-ink">
                {tagLabel(tag)}
              </span>
            ))}
          </div>
        </div>
      </div>
      <blockquote className="max-w-xs font-display text-2xl leading-snug italic text-foreground/75">
        “{persona.motto}”
      </blockquote>
    </header>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function ShelfRow({ entry, rank }: { entry: RankedResource; rank: number }) {
  const { resource, stats, reasons } = entry;
  const trending = stats.trend > 0.82;
  return (
    <li className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border bg-card p-3 pr-4 sm:grid-cols-[1.75rem_6.5rem_minmax(0,1fr)_auto] sm:gap-4">
      <span className="text-center font-display text-xl text-muted-foreground tabular-nums">
        {rank}
      </span>
      <span className="hidden overflow-hidden rounded-lg sm:block">
        <Cover item={resource} />
      </span>
      <div className="min-w-0">
        <ResourceDialog resource={resource}>
          <button type="button" className="text-left font-medium leading-snug hover:underline">
            {resource.title}
          </button>
        </ResourceDialog>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {resource.creator} · {TYPE_NOUN[resource.type]}
        </p>
        <p className="mt-1.5 flex flex-wrap gap-1.5">
          {trending ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-ember-soft px-2 py-0.5 text-xs text-ember-ink">
              <TrendingUpIcon className="size-3" aria-hidden="true" />
              Trending
            </span>
          ) : null}
          {reasons
            .filter((reason) => !reason.startsWith("Trending"))
            .slice(0, 2)
            .map((reason) => (
              <span key={reason} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {reason}
              </span>
            ))}
        </p>
      </div>
      <span className="text-xs text-muted-foreground">
        <LikeButton resource={resource} compact />
      </span>
    </li>
  );
}
