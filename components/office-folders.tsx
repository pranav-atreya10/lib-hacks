"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRightIcon, CheckCircle2Icon, PlusIcon } from "lucide-react";
import { useLibraryState } from "@/components/library-state";
import { PersonaAvatar } from "@/components/persona-avatar";
import { RecommendDialog } from "@/components/recommend-dialog";
import { Cover } from "@/components/cover";
import { PERSONAS, type Persona } from "@/lib/personas";
import { offices, type Office } from "@/lib/offices";
import type { Resource } from "@/lib/content";
import { cn } from "@/lib/utils";

const COLLAPSED_COUNT = 12;

/**
 * The top of the library: office folders. Offices where our people work come
 * first; the reader's own office is the big folder, with a deliberately small
 * "Recommend" tile beside it.
 */
export function OfficeFolders() {
  const { persona, allResources } = useLibraryState();
  const [showAll, setShowAll] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const byOffice = useMemo(() => {
    const map = new Map<string, Resource[]>();
    for (const resource of allResources) {
      const list = map.get(resource.office) ?? [];
      list.push(resource);
      map.set(resource.office, list);
    }
    return map;
  }, [allResources]);

  const peopleByOffice = useMemo(() => {
    const map = new Map<string, Persona[]>();
    for (const person of PERSONAS) {
      map.set(person.office, [...(map.get(person.office) ?? []), person]);
    }
    return map;
  }, []);

  const peopleOffices = useMemo(() => {
    const slugs = [...new Set(PERSONAS.map((person) => person.office))];
    return slugs
      .map((slug) => offices.find((office) => office.slug === slug))
      .filter((office): office is Office => !!office);
  }, []);

  const otherOffices = offices.filter((office) => !peopleByOffice.has(office.slug));
  const visibleOthers = showAll ? otherOffices : otherOffices.slice(0, COLLAPSED_COUNT);
  const home = persona ? peopleOffices.find((office) => office.slug === persona.office) : null;

  return (
    <section aria-labelledby="offices-heading" data-tour="offices">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <h2 id="offices-heading" className="text-lg font-semibold">
            Office folders
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Each office keeps its own shelf. The offices our people work in come first.
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

      {home && persona ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_9.5rem]">
          <HomeFolder
            office={home}
            persona={persona}
            files={byOffice.get(home.slug) ?? []}
          />
          <RecommendDialog onAdded={setJustAdded}>
            <button
              type="button"
              data-tour="recommend"
              className="press group flex flex-row items-center justify-center gap-2 self-stretch rounded-2xl border border-dashed border-foreground/25 bg-card/50 px-4 py-4 text-sm font-medium text-muted-foreground hover:border-foreground/50 hover:bg-card hover:text-foreground sm:mt-3 sm:flex-col sm:py-0"
            >
              <span className="grid size-9 place-items-center rounded-full bg-foreground text-background transition-transform duration-200 ease-(--ease-out) group-hover:scale-105">
                <PlusIcon className="size-4" aria-hidden="true" />
              </span>
              Recommend
            </button>
          </RecommendDialog>
        </div>
      ) : null}

      {justAdded && persona ? (
        <p
          className="rise-in mt-3 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-800 dark:text-emerald-300"
          role="status"
        >
          <CheckCircle2Icon className="size-4 shrink-0" aria-hidden="true" />
          <span>
            <strong className="font-semibold">{justAdded}</strong> is on the {home?.city} shelf
            and at the top of {persona.name.split(" ")[0]}&rsquo;s ranking.
          </span>
        </p>
      ) : null}

      <ul
        className={cn(
          "grid gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-3",
          home ? "mt-8" : "mt-6",
        )}
        aria-label="Offices where our people work"
      >
        {peopleOffices
          .filter((office) => office.slug !== home?.slug)
          .map((office) => (
            <li key={office.slug}>
              <PeopleFolder
                office={office}
                people={peopleByOffice.get(office.slug) ?? []}
                count={byOffice.get(office.slug)?.length ?? 0}
              />
            </li>
          ))}
      </ul>

      <div className="mt-10">
        <h3 className="eyebrow">Every other office</h3>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {visibleOthers.map((office) => (
            <li key={office.slug}>
              <Link
                href={`/offices/${office.slug}`}
                className="press flex items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm hover:border-border hover:bg-card"
              >
                <span className="truncate">{office.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {byOffice.get(office.slug)?.length ?? 0}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {otherOffices.length > COLLAPSED_COUNT ? (
          <button
            type="button"
            onClick={() => setShowAll((value) => !value)}
            aria-expanded={showAll}
            className="press mt-2 rounded-lg px-3 py-2 text-sm font-medium text-brand-ink hover:bg-brand/8"
          >
            {showAll ? "Show fewer" : `Show all ${otherOffices.length} other offices`}
          </button>
        ) : null}
      </div>
    </section>
  );
}

function HomeFolder({
  office,
  persona,
  files,
}: {
  office: Office;
  persona: Persona;
  files: Resource[];
}) {
  const first = persona.name.split(" ")[0];
  return (
    <Link
      href={`/offices/${office.slug}`}
      style={{ "--folder-tab": "var(--card)" } as React.CSSProperties}
      className="folder lift group grid gap-6 rounded-2xl border border-border bg-card p-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-7"
    >
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <PersonaAvatar persona={persona} size="xs" />
          {first}&rsquo;s office
        </p>
        <h3 className="mt-2 font-display text-[2.5rem] leading-none">{office.city}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {office.name !== office.city ? `${office.name} · ` : ""}
          {files.length} files · {first} can recommend and tag here
        </p>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium">
          Open folder
          <ArrowRightIcon
            className="size-3.5 transition-transform duration-200 ease-(--ease-out) group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </div>
      <div className="relative hidden h-28 w-64 sm:block" aria-hidden="true">
        {files.slice(0, 3).map((file, index) => (
          <div
            key={file.id}
            className="absolute top-0 w-40 overflow-hidden rounded-lg border border-border shadow-sm transition-transform duration-300 ease-(--ease-out)"
            style={{
              left: `${index * 3.25}rem`,
              transform: `rotate(${(index - 1) * 4}deg) translateY(${index === 1 ? -4 : 4}px)`,
              zIndex: index === 1 ? 3 : 3 - Math.abs(index - 1),
            }}
          >
            <Cover item={file} />
          </div>
        ))}
      </div>
    </Link>
  );
}

function PeopleFolder({
  office,
  people,
  count,
}: {
  office: Office;
  people: Persona[];
  count: number;
}) {
  return (
    <Link
      href={`/offices/${office.slug}`}
      className="folder lift group flex h-full flex-col gap-5 rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold">{office.city}</h3>
          <p className="truncate text-sm text-muted-foreground">
            {office.name !== office.city ? office.name : `${office.city}, ${office.state}`}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium tabular-nums">
          {count} files
        </span>
      </div>
      <div className="mt-auto flex items-center gap-2 text-sm text-muted-foreground">
        <span className="flex -space-x-1.5">
          {people.map((person) => (
            <PersonaAvatar
              key={person.id}
              persona={person}
              size="sm"
              className="ring-2 ring-card"
            />
          ))}
        </span>
        {people.map((person) => person.name.split(" ")[0]).join(" & ")} works here
      </div>
    </Link>
  );
}
