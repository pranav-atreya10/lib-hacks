"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { Resource } from "@/lib/content";
import type { Office } from "@/lib/offices";
import {
  activeFilterCount,
  emptyFilters,
  filterResources,
  parseFilters,
  toQueryString,
  type Filters,
} from "@/lib/filters";
import { FilterBar, ClearFiltersButton } from "@/components/filter-bar";
import { ResourceCard } from "@/components/resource-card";
import { Button } from "@/components/ui/button";
import { officeBySlug } from "@/lib/offices";

interface LibraryExplorerProps {
  resources: Resource[];
  offices: Office[];
  tagCounts: [string, number][];
  typeCounts: Record<"book" | "podcast" | "video" | "article", number>;
  /** When set, the shelf is fixed to this office (used by /offices/[slug]). */
  lockedOffice?: string;
}

export function LibraryExplorer({
  resources,
  offices,
  tagCounts,
  typeCounts,
  lockedOffice,
}: LibraryExplorerProps) {
  const pathname = usePathname();
  const [filters, setFilters] = useState<Filters>({
    ...emptyFilters,
    office: lockedOffice ?? "all",
  });

  // Read the URL once on mount so shared links open with their filters applied.
  // Kept out of useSearchParams deliberately: this page needs no Suspense
  // boundary and no server render of the query string.
  useEffect(() => {
    const parsed = parseFilters(new URLSearchParams(window.location.search));
    setFilters({ ...parsed, office: lockedOffice ?? parsed.office });
  }, [lockedOffice]);

  useEffect(() => {
    const query = toQueryString(filters);
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  }, [filters, pathname]);

  const visible = useMemo(() => filterResources(resources, filters), [resources, filters]);
  const activeCount = activeFilterCount(filters);
  const suggestions = useMemo(
    () => resources.filter((resource) => resource.office !== filters.office).slice(0, 3),
    [resources, filters.office],
  );

  const officeModels = useMemo(
    () =>
      offices.map((office) => ({
        slug: office.slug,
        name: office.name,
        count: resources.filter((resource) => resource.office === office.slug).length,
      })),
    [offices, resources],
  );

  return (
    <div className="space-y-6">
      <FilterBar
        filters={filters}
        onChange={setFilters}
        offices={officeModels}
        tags={tagCounts.map(([tag, count]) => ({ tag, count }))}
        typeCounts={typeCounts}
        total={resources.length}
        lockedOffice={lockedOffice}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          <span className="font-mono text-foreground">{visible.length}</span> of{" "}
          {resources.length} resources
          {activeCount > 0 ? ` · ${activeCount} filter${activeCount === 1 ? "" : "s"}` : ""}
        </p>
        {activeCount > 0 ? (
          <ClearFiltersButton
            onClick={() => setFilters({ ...emptyFilters, office: lockedOffice ?? "all" })}
          />
        ) : null}
      </div>

      {visible.length > 0 ? (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((resource) => {
            const office = officeBySlug.get(resource.office);
            if (!office) return null;
            return (
              <li key={resource.id} className="h-full">
                <ResourceCard resource={resource} office={office} />
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-[3px] border border-dashed border-border p-8 text-center">
          <p className="font-heading text-xl">
            Nothing on the shelf for {filters.query ? `“${filters.query}”` : "that mix"}
            {filters.office !== "all" && officeBySlug.get(filters.office)
              ? ` in ${officeBySlug.get(filters.office)?.city}`
              : ""}
            .
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a wider filter, or start from one of these instead.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setFilters({ ...emptyFilters, office: lockedOffice ?? "all" })}
          >
            Clear filters
          </Button>

          <ul className="mt-6 grid gap-2 text-left sm:grid-cols-3">
            {suggestions.map((resource) => {
              const office = officeBySlug.get(resource.office);
              return (
                <li key={resource.id}>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-[3px] border border-border bg-card p-3 text-sm hover:border-brand/60"
                  >
                    <span className="catalog-code">{office?.code}</span>
                    <span className="mt-1 block font-medium leading-snug">
                      {resource.title}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
