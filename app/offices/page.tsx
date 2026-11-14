import type { Metadata } from "next";
import Link from "next/link";
import { FolderIcon } from "lucide-react";
import { offices } from "@/lib/offices";
import { officeCounts, resourcesByOffice } from "@/lib/content";

export const metadata: Metadata = {
  title: "Offices",
  description: "Every office and the shelf it keeps.",
};

export default function OfficesPage() {
  const counts = officeCounts();

  return (
    <div className="page-shell py-8 sm:py-10">
      <header className="max-w-2xl">
        <h1 className="text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
          Office folders
        </h1>
        <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
          {offices.length} shelves, one library. Each office keeps its own picks;
          Florham Park and both New York offices keep a full ten.
        </p>
      </header>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {offices.map((office) => {
          const shelf = resourcesByOffice(office.slug);
          return (
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
                    {counts.get(office.slug) ?? 0}
                  </span>
                </div>
                <div>
                  <h2 className="text-sm font-medium leading-tight">{office.name}</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {office.city}, {office.state} · {office.code}
                  </p>
                </div>
                <ul className="mt-auto space-y-0.5 border-t border-border pt-2.5 text-xs text-muted-foreground">
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
