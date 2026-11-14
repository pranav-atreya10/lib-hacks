import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, BuildingsIcon } from "@/components/icons";
import { getOffice, offices } from "@/lib/offices";
import { resourcesByOffice } from "@/lib/content";
import { PERSONAS } from "@/lib/personas";
import { LibraryExplorer } from "@/components/library-explorer";
import { OfficeActions } from "@/components/office-actions";
import { PersonaAvatar } from "@/components/persona-avatar";

export function generateStaticParams() {
  return offices.map((office) => ({ slug: office.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/offices/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const office = getOffice(slug);
  if (!office) return { title: "Office not found" };
  return {
    title: `${office.name} shelf`,
    description: `What the ${office.city} office recommends.`,
  };
}

export default async function OfficePage({ params }: PageProps<"/offices/[slug]">) {
  const { slug } = await params;
  const office = getOffice(slug);
  if (!office) notFound();

  const locals = PERSONAS.filter((person) => person.office === office.slug);
  const officeIndex = offices.findIndex((entry) => entry.slug === office.slug);
  const neighbours = [
    offices[(officeIndex + 1) % offices.length],
    offices[(officeIndex + 4) % offices.length],
  ];

  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_17rem] lg:px-12 lg:py-14">
      <div className="grid min-w-0 grid-cols-1 content-start gap-10">
        <header>
          <Link
            href="/library"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="size-3.5" aria-hidden="true" />
            Library
          </Link>
          <span className="mt-6 grid size-16 place-items-center rounded-xl bg-primary text-primary-foreground">
            <BuildingsIcon className="size-7" aria-hidden="true" />
          </span>
          <h1 className="mt-5 font-display text-[2.25rem] leading-tight">{office.name}</h1>
          <p className="mt-2 text-[0.9375rem] text-muted-foreground">
            {resourcesByOffice(office.slug).length} files kept by this office
          </p>
        </header>

        <LibraryExplorer shelf={office.slug} />
      </div>

      <aside className="grid content-start gap-6 lg:sticky lg:top-8 lg:self-start">
        <section className="surface grid gap-4 p-5" aria-labelledby="office-actions-heading">
          <h2 id="office-actions-heading" className="text-sm font-semibold">
            Your access
          </h2>
          <OfficeActions officeSlug={office.slug} city={office.city} />
        </section>

        <section className="surface p-5" aria-labelledby="office-details-heading">
          <h2 id="office-details-heading" className="text-sm font-semibold">
            Office details
          </h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Address</dt>
              <dd className="mt-0.5">
                {office.address}, {office.city}, {office.state} {office.zip}
              </dd>
            </div>
            {office.phone ? (
              <div>
                <dt className="text-xs text-muted-foreground">Phone</dt>
                <dd className="mt-0.5 tabular-nums">{office.phone}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-xs text-muted-foreground">Shelf code</dt>
              <dd className="mt-0.5 font-mono text-xs">{office.code}</dd>
            </div>
            {locals.length > 0 ? (
              <div>
                <dt className="text-xs text-muted-foreground">Works here</dt>
                <dd className="mt-1 grid gap-1.5">
                  {locals.map((person) => (
                    <Link
                      key={person.id}
                      href={`/people/${person.id}`}
                      className="flex items-center gap-2 hover:underline"
                    >
                      <PersonaAvatar persona={person} size="xs" />
                      {person.name}
                    </Link>
                  ))}
                </dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section aria-labelledby="elsewhere-heading" className="px-1">
          <h2 id="elsewhere-heading" className="text-xs text-muted-foreground">
            Elsewhere in the library
          </h2>
          <ul className="mt-2 grid gap-1 text-sm">
            {neighbours.map((neighbour) => (
              <li key={neighbour.slug}>
                <Link href={`/offices/${neighbour.slug}`} className="hover:underline">
                  {neighbour.name} · {resourcesByOffice(neighbour.slug).length}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}
