import type { Metadata } from "next";
import { Suspense } from "react";
import { requireMember } from "@/lib/auth";
import { q } from "@/lib/db";
import { companyLibraries } from "@/lib/library";
import { COLLECTIONS, TEMPLATES, collectionItems } from "@/lib/marketplace";
import { PageHeader, PageSkeleton } from "@/components/page-header";
import { AddToLibrary, CreateLibraryButton } from "@/components/app-controls";
import { Cover } from "@/components/cover";
import { tagLabel } from "@/lib/tags";

export const metadata: Metadata = { title: "Marketplace" };

async function Marketplace() {
  const viewer = await requireMember();
  const libraries = await companyLibraries(viewer.membership.companyId, viewer.id);
  const isCompanyAdmin = viewer.membership.role === "admin";
  const mine = libraries.filter((library) => library.myRole === "admin" || isCompanyAdmin);
  // How many workspaces use each collection: social proof across companies, no names.
  const usage = new Map(
    (
      await q<{ collection_key: string; companies: string | number }>(
        `select c.collection_key, count(distinct l.company_id) as companies
           from library_collections c join libraries l on l.id = c.library_id group by c.collection_key`,
      )
    ).map((row) => [row.collection_key, Number(row.companies)]),
  );

  return (
    <div className="app-page grid grid-cols-1 gap-12">
      <PageHeader
        title="Marketplace"
        description="Curated collections of real books, talks, podcasts and articles. Add one to any library you run, or start a library from a template."
      />

      <section aria-labelledby="collections" className="grid gap-4">
        <h2 id="collections" className="text-lg font-semibold tracking-tight">
          Collections
        </h2>
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {COLLECTIONS.map((collection) => {
            const entries = collectionItems(collection);
            const companies = usage.get(collection.key) ?? 0;
            return (
              <li key={collection.key} className="surface flex flex-col overflow-hidden">
                <div className="grid grid-cols-3 gap-1 p-3 pb-0" aria-hidden="true">
                  {entries.slice(0, 3).map((entry) => (
                    <div key={entry.slug} className="overflow-hidden rounded-md">
                      <Cover item={entry} />
                    </div>
                  ))}
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div>
                    <h3 className="font-semibold">{collection.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{collection.description}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {entries.length} files · {collection.tags.map(tagLabel).join(", ")}
                    {companies ? ` · used by ${companies} ${companies === 1 ? "workspace" : "workspaces"}` : ""}
                  </p>
                  <div className="mt-auto pt-2">
                    <AddToLibrary
                      collectionKey={collection.key}
                      name={collection.name}
                      libraries={mine.map((library) => ({
                        id: library.id,
                        name: library.name,
                        added: library.collections.includes(collection.key),
                      }))}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="templates" className="grid gap-4">
        <h2 id="templates" className="text-lg font-semibold tracking-tight">
          Library templates
        </h2>
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {TEMPLATES.map((template) => (
            <li key={template.key} className="surface flex flex-col gap-3 p-5">
              <h3 className="font-semibold">{template.name}</h3>
              <p className="text-sm text-muted-foreground">{template.description}</p>
              <div className="mt-auto pt-2">
                <CreateLibraryButton templateKey={template.key} label="Use template" />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Marketplace />
    </Suspense>
  );
}
