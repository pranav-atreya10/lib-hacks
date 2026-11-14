"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRightIcon, CheckCircle2Icon, PlusIcon } from "@/components/icons";
import { useLibraryState } from "@/components/library-state";
import { PersonaAvatar } from "@/components/persona-avatar";
import { RecommendDialog } from "@/components/recommend-dialog";
import { Cover } from "@/components/cover";
import { PERSONAS, type Persona } from "@/lib/personas";
import { offices, type Office } from "@/lib/offices";
import type { Resource } from "@/lib/content";
import { cn } from "@/lib/utils";

const COLLAPSED_COUNT = 12;

function useShelves() {
  const { allResources } = useLibraryState();
  return useMemo(() => {
    const map = new Map<string, Resource[]>();
    for (const resource of allResources) {
      const list = map.get(resource.office) ?? [];
      list.push(resource);
      map.set(resource.office, list);
    }
    return map;
  }, [allResources]);
}

/**
 * Front and centre on /library: the folders of the offices our people work
 * in, one per person. The reader's own office is marked, with a small
 * Recommend action beside the folder.
 */
export function OfficeFolders() {
  const { persona } = useLibraryState();
  const shelves = useShelves();
  const [justAdded, setJustAdded] = useState<string | null>(null);

  return (
    <section aria-labelledby="offices-heading" data-tour="offices" className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <h2 id="offices-heading" className="text-lg font-semibold tracking-tight">
            Our offices
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Where our people work. Each office keeps its own shelf.
          </p>
        </div>
        <Link
          href="/offices"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          All {offices.length} offices
          <ArrowRightIcon className="size-3.5" aria-hidden="true" />
        </Link>
      </div>

      <ul className="grid gap-4 md:grid-cols-3" aria-label="Offices where our people work">
        {PERSONAS.map((person) => {
          const office = offices.find((entry) => entry.slug === person.office);
          if (!office) return null;
          return (
            <li key={person.id}>
              <OfficeFolder
                office={office}
                person={person}
                files={shelves.get(office.slug) ?? []}
                mine={persona?.id === person.id}
                onAdded={setJustAdded}
              />
            </li>
          );
        })}
      </ul>

      {justAdded && persona ? (
        <p
          className="rise-in flex items-center gap-2 rounded-lg bg-tint-green px-4 py-2.5 text-sm text-tint-green-ink"
          role="status"
        >
          <CheckCircle2Icon className="size-4 shrink-0" aria-hidden="true" />
          <span>
            <strong className="font-semibold">{justAdded}</strong> is on the{" "}
            {offices.find((office) => office.slug === persona.office)?.city} shelf and at the top
            of {persona.name.split(" ")[0]}&rsquo;s ranking.
          </span>
        </p>
      ) : null}
    </section>
  );
}

function OfficeFolder({
  office,
  person,
  files,
  mine,
  onAdded,
}: {
  office: Office;
  person: Persona;
  files: Resource[];
  mine: boolean;
  onAdded: (title: string) => void;
}) {
  const first = person.name.split(" ")[0];
  return (
    <article
      className={cn(
        "folder lift relative flex h-full flex-col rounded-xl border bg-card",
        mine
          ? "border-foreground/60 [--folder-edge:color-mix(in_oklab,var(--foreground)_60%,transparent)]"
          : "border-border",
      )}
    >
      <div className="grid grid-cols-3 gap-1.5 p-3 pb-0" aria-hidden="true">
        {files.slice(0, 3).map((file) => (
          <div key={file.id} className="overflow-hidden rounded-md">
            <Cover item={file} />
          </div>
        ))}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-xl font-semibold tracking-tight">
              <Link
                href={`/offices/${office.slug}`}
                className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
              >
                {office.city}
                <span className="sr-only">, {first}’s office</span>
              </Link>
            </h3>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {office.name !== office.city ? office.name : `${office.city}, ${office.state}`} ·{" "}
              {files.length} files
            </p>
          </div>
          {mine ? <span className="tag shrink-0 bg-tint-blue text-tint-blue-ink">Your office</span> : null}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
          <span className="flex min-w-0 items-center gap-2 text-sm">
            <PersonaAvatar persona={person} size="xs" />
            <span className="truncate text-muted-foreground">
              <span className="font-medium text-foreground">{first}</span> ·{" "}
              {person.traits.slice(1).join(", ")}
            </span>
          </span>
          {mine ? (
            <RecommendDialog onAdded={onAdded}>
              <button
                type="button"
                data-tour="recommend"
                className="press relative z-10 inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[6px] border border-border bg-card px-2.5 text-xs font-medium hover:bg-muted"
              >
                <PlusIcon className="size-3.5" aria-hidden="true" />
                Recommend
              </button>
            </RecommendDialog>
          ) : (
            <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          )}
        </div>
      </div>
    </article>
  );
}

/** Every other office, as a quiet list further down the page. */
export function OtherOffices() {
  const shelves = useShelves();
  const [showAll, setShowAll] = useState(false);
  const peopleOffices = new Set(PERSONAS.map((person) => person.office));
  const others = offices.filter((office) => !peopleOffices.has(office.slug));
  const visible = showAll ? others : others.slice(0, COLLAPSED_COUNT);

  return (
    <section aria-labelledby="other-offices-heading" className="grid gap-4">
      <div>
        <h2 id="other-offices-heading" className="text-lg font-semibold tracking-tight">
          Every other office
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {others.length} more shelves. Open one you&rsquo;d never visit.
        </p>
      </div>
      <ul className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {visible.map((office) => (
          <li key={office.slug} className="bg-card">
            <Link
              href={`/offices/${office.slug}`}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-muted"
            >
              <span className="truncate">{office.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {shelves.get(office.slug)?.length ?? 0}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {others.length > COLLAPSED_COUNT ? (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          aria-expanded={showAll}
          className="press justify-self-start rounded-[6px] px-3 py-2 text-sm font-medium text-brand-ink hover:bg-muted"
        >
          {showAll ? "Show fewer" : `Show all ${others.length} offices`}
        </button>
      ) : null}
    </section>
  );
}
