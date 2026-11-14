import Link from "next/link";
import {
  RESOURCES,
  featuredResources,
  officeCounts,
  resourcesByOffice,
  typeCounts,
} from "@/lib/content";
import { offices, officeBySlug } from "@/lib/offices";
import { TAGS } from "@/lib/tags";
import type { MediaType } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { HeroHeadline } from "@/components/hero-headline";
import { FeaturedShelf } from "@/components/featured-shelf";
import { typeLabel } from "@/lib/media";

const TYPE_NOTES: Record<MediaType, string> = {
  book: "Long-form, worth the twelve weeks.",
  podcast: "For the commute and the washing up.",
  video: "Talks and channels people rewatch.",
  article: "Short reads that change a decision.",
};

const TYPE_ORDER: MediaType[] = ["book", "podcast", "video", "article"];

export default function HomePage() {
  const counts = typeCounts();
  const shelfCounts = officeCounts();
  const featured = featuredResources()
    .map((resource) => {
      const office = officeBySlug.get(resource.office);
      return office ? { resource, office } : null;
    })
    .filter((entry): entry is { resource: (typeof RESOURCES)[number]; office: (typeof offices)[number] } => entry !== null);

  const newest = featured[0]?.resource;
  const newestOffice = featured[0]?.office;

  const fullShelves = ["florham-park", "new-york-madison-ave", "new-york-park-ave"]
    .map((slug) => officeBySlug.get(slug))
    .filter((office): office is (typeof offices)[number] => Boolean(office));

  return (
    <>
      <section className="page-shell pt-14 pb-12 sm:pt-20">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_0.6fr] lg:items-end">
          <div>
            <p className="catalog-code">
              Open to anyone with the link · no sign-in
            </p>
            <div className="mt-4">
              <HeroHeadline />
            </div>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Books, podcasts, talks and articles our offices actually
              recommend — tagged, so you can find the one you need on a Tuesday
              afternoon.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Button size="lg" className="h-11 px-5 text-[0.95rem]" asChild>
                <Link href="/library">Open the library</Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                <span className="font-mono text-foreground">{RESOURCES.length}</span>{" "}
                resources ·{" "}
                <span className="font-mono text-foreground">{offices.length}</span> offices
                · <span className="font-mono text-foreground">{TAGS.length}</span> tags
              </p>
            </div>
          </div>

          {newest && newestOffice ? (
            <aside
              aria-label="Newest arrival"
              className="relative rounded-[3px] border border-border bg-card p-5"
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-[3px] bg-ember"
              />
              <p className="catalog-code text-ember-ink">Newest arrival</p>
              <h2 className="mt-2 font-heading text-2xl leading-tight">
                <a
                  href={newest.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-ink"
                >
                  {newest.title}
                </a>
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{newest.creator}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {newest.blurb}
              </p>
              <p className="catalog-code mt-4 border-t border-border pt-3">
                {newestOffice.code} · {typeLabel(newest.type)} · {newest.length}
              </p>
            </aside>
          ) : null}
        </div>
      </section>

      <Reveal as="section" className="shelf-rule">
        <div className="page-shell py-10">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-2xl">What&rsquo;s inside</h2>
            <p className="catalog-code">four kinds of thing</p>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
            {TYPE_ORDER.map((type) => (
              <div key={type} className="border-t border-border pt-3">
                <dt className="text-sm font-medium">{typeLabel(type)}s</dt>
                <dd>
                  <p className="mt-1 font-mono text-4xl tabular-nums tracking-tight">
                    {counts[type]}
                  </p>
                  <p className="mt-2 text-sm leading-snug text-muted-foreground">
                    {TYPE_NOTES[type]}
                  </p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Reveal>

      <Reveal as="section" className="shelf-rule">
        <div className="page-shell py-10">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-2xl">On the shelf this week</h2>
            <Link href="/library" className="text-sm text-brand-ink hover:underline">
              See all {RESOURCES.length}
            </Link>
          </div>
          <div className="mt-5">
            <FeaturedShelf items={featured} />
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="shelf-rule">
        <div className="page-shell py-10">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-2xl">Find your office</h2>
            <Link href="/offices" className="text-sm text-brand-ink hover:underline">
              All {offices.length} offices
            </Link>
          </div>
          <ul className="mt-6 grid gap-x-6 gap-y-6 sm:grid-cols-3">
            {fullShelves.map((office) => (
              <li key={office.slug} className="border-t border-border pt-3">
                <Link
                  href={`/offices/${office.slug}`}
                  className="group flex items-baseline justify-between gap-3"
                >
                  <span className="font-heading text-xl group-hover:text-brand-ink">
                    {office.name}
                  </span>
                  <span className="font-mono text-sm text-muted-foreground">
                    {shelfCounts.get(office.slug) ?? 0}
                  </span>
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">
                  {office.city}, {office.state} · {office.address}
                </p>
                <ul className="mt-2 space-y-0.5 text-sm text-muted-foreground">
                  {resourcesByOffice(office.slug)
                    .slice(0, 2)
                    .map((resource) => (
                      <li key={resource.id} className="truncate">
                        {resource.title}
                      </li>
                    ))}
                </ul>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted-foreground">
            …and {offices.length - fullShelves.length} more offices, each with
            three picks of their own.
          </p>
        </div>
      </Reveal>
    </>
  );
}
