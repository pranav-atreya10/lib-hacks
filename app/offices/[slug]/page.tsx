import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { getOffice, offices } from "@/lib/offices";
import { resourcesByOffice } from "@/lib/content";
import { LibraryExplorer } from "@/components/library-explorer";
import { OfficeActions } from "@/components/office-actions";
import { Button } from "@/components/ui/button";

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

  const officeIndex = offices.findIndex((entry) => entry.slug === office.slug);
  const neighbours = [
    offices[(officeIndex + 1) % offices.length],
    offices[(officeIndex + 4) % offices.length],
  ];

  return (
    <div className="page-shell grid grid-cols-1 gap-10 py-10 sm:py-14">
      <header className="max-w-2xl">
        <Link
          href="/library"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3.5" aria-hidden="true" />
          Library
        </Link>
        <h1 className="mt-4 font-display text-[3rem] leading-none sm:text-[3.75rem]">
          {office.name}
        </h1>
        <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted-foreground">
          {resourcesByOffice(office.slug).length} files kept by this office · {office.address},{" "}
          {office.city}, {office.state} {office.zip}
          {office.phone ? ` · ${office.phone}` : null}
        </p>
      </header>

      <OfficeActions officeSlug={office.slug} city={office.city} />

      <LibraryExplorer shelf={office.slug} />

      <section className="border-t border-border pt-8">
        <h2 className="text-[0.9375rem] font-semibold">Elsewhere in the library</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {neighbours.map((neighbour) => (
            <Button key={neighbour.slug} variant="outline" size="sm" asChild>
              <Link href={`/offices/${neighbour.slug}`}>
                {neighbour.name} · {resourcesByOffice(neighbour.slug).length}
              </Link>
            </Button>
          ))}
          <Button variant="ghost" size="sm" asChild>
            <Link href="/library">Back to the library</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
