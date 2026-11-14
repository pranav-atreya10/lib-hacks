"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { MediaType } from "@/lib/catalog";
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
import { FolderBar, type FolderKey } from "@/components/folder-bar";
import { useLibraryState } from "@/components/library-state";
import { ResourceCard } from "@/components/resource-card";
import { Button } from "@/components/ui/button";
import { officeBySlug } from "@/lib/offices";

interface LibraryExplorerProps {
  resources: Resource[];
  offices: Office[];
  tagCounts: [string, number][];
  /** When set, the shelf is fixed to this office (used by /offices/[slug]). */
  lockedOffice?: string;
}

export function LibraryExplorer({
  resources,
  offices,
  tagCounts,
  lockedOffice,
}: LibraryExplorerProps) {
  const pathname = usePathname();
  const { allResources } = useLibraryState();

  // Files people added in this browser join the shelf they were added to.
  const source = useMemo(() => {
    const extras = allResources.filter(
      (resource) =>
        resource.id.startsWith("local-") &&
        (!lockedOffice || resource.office === lockedOffice),
    );
    return extras.length > 0 ? [...extras, ...resources] : resources;
  }, [allResources, lockedOffice, resources]);

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

  const visible = useMemo(() => filterResources(source, filters), [source, filters]);
  const activeCount = activeFilterCount(filters);

  const folderCounts = useMemo(() => {
    const counts: Record<MediaType, number> = {
      book: 0,
      podcast: 0,
      video: 0,
      article: 0,
    };
    for (const resource of source) counts[resource.type] += 1;
    return counts;
  }, [source]);

  const activeFolder: FolderKey =
    filters.types.length === 1 ? filters.types[0] : "all";

  function openFolder(next: FolderKey) {
    setFilters({ ...filters, types: next === "all" ? [] : [next] });
  }

  const suggestions = useMemo(
    () => source.filter((resource) => resource.office !== filters.office).slice(0, 3),
    [source, filters.office],
  );

  const officeModels = useMemo(
    () =>
      offices.map((office) => ({
        slug: office.slug,
        name: office.name,
        count: source.filter((resource) => resource.office === office.slug).length,
      })),
    [offices, source],
  );

  return (
    <div className="space-y-5">
      <FolderBar
        active={activeFolder}
        counts={folderCounts}
        total={source.length}
        onChange={openFolder}
      />

      <FilterBar
        filters={filters}
        onChange={setFilters}
        offices={officeModels}
        tags={tagCounts.map(([tag, count]) => ({ tag, count }))}
        total={source.length}
        lockedOffice={lockedOffice}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[0.8125rem] text-muted-foreground" aria-live="polite">
          <span className="font-medium text-foreground">{visible.length}</span> of{" "}
          {source.length} files
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
        <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
          <p className="text-base font-medium">
            Nothing in this folder for{" "}
            {filters.query ? `“${filters.query}”` : "that mix"}
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

          <ul className="mx-auto mt-8 grid max-w-3xl gap-2 text-left sm:grid-cols-3">
            {suggestions.map((resource) => {
              const office = officeBySlug.get(resource.office);
              return (
                <li key={resource.id}>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-md border border-border bg-card p-3 text-sm transition-colors hover:border-brand/50"
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
