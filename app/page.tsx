import Link from "next/link";
import {
  RESOURCES,
  officeCounts,
  resourcesByOffice,
  typeCounts,
} from "@/lib/content";
import { offices, officeBySlug } from "@/lib/offices";
import { PERSONAS, initials } from "@/lib/personas";
import { libraryTotals, trendingScore } from "@/lib/engagement";
import type { MediaType } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { HeroHeadline } from "@/components/hero-headline";
import { FeaturedShelf } from "@/components/featured-shelf";
import { FolderGrid } from "@/components/folder-grid";
import { FolderIcon, SparklesIcon } from "lucide-react";

const FULL_SHELVES = ["florham-park", "new-york-madison-ave", "new-york-park-ave"];

/** One trending file per medium, so the row doesn't read as three of a kind. */
function trendingPicks() {
  const sorted = [...RESOURCES].sort(
    (a, b) => trendingScore(b.id) - trendingScore(a.id),
  );
  const seen = new Set<MediaType>();
  const picks: typeof RESOURCES = [];
  for (const resource of sorted) {
    if (seen.has(resource.type)) continue;
    seen.add(resource.type);
    picks.push(resource);
    if (picks.length === 3) break;
  }
  return picks.flatMap((resource) => {
    const office = officeBySlug.get(resource.office);
    return office ? [{ resource, office }] : [];
  });
}

export default function HomePage() {
  const counts = typeCounts();
  const shelfCounts = officeCounts();
  const totals = libraryTotals(RESOURCES);
  const trending = trendingPicks();

  const fullShelves = FULL_SHELVES.map((slug) => officeBySlug.get(slug)).filter(
    (office): office is (typeof offices)[number] => Boolean(office),
  );

  return (
    <>
      <section className="page-shell pt-10 pb-9 sm:pt-16">
        <HeroHeadline />

        <p className="mt-5 max-w-2xl text-[0.9375rem] leading-relaxed text-muted-foreground">
          Books, podcasts, talks and articles filed by 74 offices — ranked for
          whoever is reading, so a finance analyst in New York and a biology
          student in Austin get different shelves from the same library.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.8125rem] text-muted-foreground">
          <span>
            <span className="font-medium text-foreground">{RESOURCES.length}</span> files
          </span>
          <span aria-hidden="true" className="text-border">|</span>
          <span>
            <span className="font-medium text-foreground">{PERSONAS.length}</span> people
          </span>
          <span aria-hidden="true" className="text-border">|</span>
          <span>
            <span className="font-medium text-foreground">
              {totals.views.toLocaleString("en-US")}
            </span>{" "}
            views
          </span>
          <span aria-hidden="true" className="text-border">|</span>
          <span>
            <span className="font-medium text-foreground">
              {totals.likes.toLocaleString("en-US")}
            </span>{" "}
            likes
          </span>
          <span aria-hidden="true" className="text-border">|</span>
          <span>No sign-in</span>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Button asChild className="h-8 px-3 text-[0.8125rem]">
            <Link href="/library">Open all files</Link>
          </Button>
          <Button variant="outline" asChild className="h-8 px-3 text-[0.8125rem]">
            <Link href="/people">Find your shelf</Link>
          </Button>
        </div>
      </section>

      <section className="page-shell border-t border-border py-7">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">Folders</h2>
            <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">
              The library's top level: pick a folder to see what is filed inside.
            </p>
          </div>
          <Link
            href="/library"
            className="text-[0.8125rem] text-muted-foreground hover:text-foreground"
          >
            Browse all files →
          </Link>
        </div>
        <div className="mt-3">
          <FolderGrid counts={counts} officeCount={offices.length} />
        </div>
      </section>

      <section className="page-shell border-t border-border py-7">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">Who is reading</h2>
            <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">
              Six people, six different rankings of the same files.
            </p>
          </div>
          <Link
            href="/people"
            className="text-[0.8125rem] text-muted-foreground hover:text-foreground"
          >
            All people →
          </Link>
        </div>

        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PERSONAS.map((persona) => {
            const office = officeBySlug.get(persona.office);
            return (
              <li key={persona.id}>
                <Link
                  href={`/people/${persona.id}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:border-brand/40 hover:bg-muted/40"
                >
                  <span
                    className="grid size-8 shrink-0 place-items-center rounded-full text-[0.65rem] font-semibold text-white"
                    style={{ backgroundColor: persona.accent }}
                    aria-hidden="true"
                  >
                    {initials(persona.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.8125rem] font-medium">
                      {persona.name}
                    </span>
                    <span className="block truncate text-[0.7rem] text-muted-foreground">
                      {office?.city} · {persona.traits.join(" · ")}
                    </span>
                  </span>
                  <span aria-hidden="true" className="text-muted-foreground">
                    →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <Reveal as="section" className="page-shell border-t border-border py-7">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">Trending this week</h2>
            <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">
              Most viewed, liked and reviewed across the offices.
            </p>
          </div>
          <Link
            href="/library?sort=newest"
            className="text-[0.8125rem] text-muted-foreground hover:text-foreground"
          >
            See all {RESOURCES.length} →
          </Link>
        </div>
        <div className="mt-3">
          <FeaturedShelf items={trending} />
        </div>
      </Reveal>

      <section className="page-shell border-t border-border py-7">
        <div className="rounded-lg border border-border bg-muted/30 p-4 sm:p-5">
          <p className="flex items-center gap-2 text-[0.65rem] font-semibold tracking-[0.14em] text-ember-ink uppercase">
            <SparklesIcon className="size-3.5" aria-hidden="true" />
            Out of your comfort zone
          </p>
          <h2 className="mt-2 max-w-2xl text-lg font-semibold leading-snug">
            Push out of your comfort zone, unlike social media.
          </h2>
          <p className="mt-1 max-w-2xl text-[0.8125rem] leading-relaxed text-muted-foreground">
            Aarav is 19 and reads about cell biology in Austin; Jonah writes
            copy in Atlanta and reads humanities. Every shelf is open, so a file
            you would never search for can still find you.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild className="h-8 px-3 text-[0.8125rem]">
              <Link href="/people/aarav-mehta">Borrow Aarav&rsquo;s shelf</Link>
            </Button>
            <Button variant="outline" asChild className="h-8 px-3 text-[0.8125rem]">
              <Link href="/people/jonah-reed">Borrow Jonah&rsquo;s shelf</Link>
            </Button>
          </div>
        </div>
      </section>

      <Reveal as="section" className="page-shell border-t border-border py-7">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">Office folders</h2>
            <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">
              Each office keeps its own shelf. These three keep the fullest ones.
            </p>
          </div>
          <Link
            href="/offices"
            className="text-[0.8125rem] text-muted-foreground hover:text-foreground"
          >
            All {offices.length} offices →
          </Link>
        </div>

        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          {fullShelves.map((office) => (
            <li key={office.slug}>
              <Link
                href={`/offices/${office.slug}`}
                className="group flex h-full flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-brand/45 hover:bg-muted/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="grid size-8 place-items-center rounded-md bg-muted text-muted-foreground group-hover:bg-card">
                    <FolderIcon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {shelfCounts.get(office.slug) ?? 0}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium">{office.name}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {office.city}, {office.state}
                  </p>
                </div>
                <ul className="mt-auto space-y-0.5 border-t border-border pt-2.5 text-xs text-muted-foreground">
                  {resourcesByOffice(office.slug)
                    .slice(0, 2)
                    .map((resource) => (
                      <li key={resource.id} className="truncate">
                        {resource.title}
                      </li>
                    ))}
                </ul>
              </Link>
            </li>
          ))}
        </ul>
      </Reveal>
    </>
  );
}
