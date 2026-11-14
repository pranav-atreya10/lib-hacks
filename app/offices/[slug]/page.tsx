import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOffice, offices } from "@/lib/offices";
import { RESOURCES, resourcesByOffice, tagCounts, typeCounts } from "@/lib/content";
import { TAGS, tagLabel, type TagId } from "@/lib/tags";
import { LibraryExplorer } from "@/components/library-explorer";
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

  const shelf = resourcesByOffice(office.slug);
  const counts = tagCounts();
  const tags = TAGS.map((tag) => [tag, counts.get(tag) ?? 0] as [string, number])
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1] || tagLabel(a[0] as TagId).localeCompare(tagLabel(b[0] as TagId)));

  const officeIndex = offices.findIndex((entry) => entry.slug === office.slug);
  const neighbours = [
    offices[(officeIndex + 1) % offices.length],
    offices[(officeIndex + 4) % offices.length],
  ];

  return (
    <div className="page-shell py-10 sm:py-12">
      <header className="max-w-2xl">
        <Link href="/offices" className="catalog-code hover:text-foreground">
          ← All offices
        </Link>
        <h1 className="mt-3 text-4xl leading-[1.05] sm:text-5xl">{office.name}</h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          {shelf.length} resources kept by this office.{" "}
          {office.address}, {office.city}, {office.state} {office.zip}
          {office.phone ? ` · ${office.phone}` : null}
        </p>
      </header>

      <div className="mt-8">
        <LibraryExplorer
          resources={shelf}
          offices={offices}
          tagCounts={tags}
          typeCounts={typeCounts()}
          lockedOffice={office.slug}
        />
      </div>

      <section className="mt-10 border-t border-border pt-6">
        <h2 className="font-heading text-xl">Elsewhere in the library</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {neighbours.map((neighbour) => (
            <Button key={neighbour.slug} variant="outline" size="sm" asChild>
              <Link href={`/offices/${neighbour.slug}`}>
                {neighbour.name} · {resourcesByOffice(neighbour.slug).length}
              </Link>
            </Button>
          ))}
          <Button variant="ghost" size="sm" asChild>
            <Link href="/library">Browse all {RESOURCES.length}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
