import type { Metadata } from "next";
import Link from "next/link";
import { offices } from "@/lib/offices";
import { officeCounts, resourcesByOffice } from "@/lib/content";

export const metadata: Metadata = {
  title: "Offices",
  description: "Every office and the shelf it keeps.",
};

export default function OfficesPage() {
  const counts = officeCounts();

  return (
    <div className="page-shell py-10 sm:py-12">
      <header className="max-w-2xl">
        <p className="catalog-code">Offices</p>
        <h1 className="mt-2 text-4xl leading-[1.05] sm:text-5xl">
          {offices.length} shelves, one library.
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Each office keeps its own picks. Florham Park and both New York
          offices keep a full ten.
        </p>
      </header>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {offices.map((office) => {
          const shelf = resourcesByOffice(office.slug);
          return (
            <li key={office.slug}>
              <Link
                href={`/offices/${office.slug}`}
                className="group flex h-full flex-col gap-3 rounded-[3px] border border-border bg-card p-4 transition-colors hover:border-brand/70"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="font-heading text-lg leading-tight">{office.name}</h2>
                  <span className="catalog-code">{office.code}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {office.city}, {office.state} · {counts.get(office.slug) ?? 0} resources
                </p>
                <ul className="mt-auto space-y-1 border-t border-border pt-2 text-sm text-muted-foreground">
                  {shelf.slice(0, 2).map((resource) => (
                    <li key={resource.id} className="truncate">
                      {resource.title}
                    </li>
                  ))}
                </ul>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
