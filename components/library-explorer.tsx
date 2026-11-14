"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { MediaType } from "@/lib/catalog";
import {
  activeFilterCount,
  emptyFilters,
  filterResources,
  parseFilters,
  toQueryString,
  type Filters,
} from "@/lib/filters";
import { FilterBar } from "@/components/filter-bar";
import { FolderBar, type FolderKey } from "@/components/folder-bar";
import { useLibraryState } from "@/components/library-state";
import { ResourceCard } from "@/components/resource-card";
import { Button } from "@/components/ui/button";
import { rankTrending } from "@/lib/personalize";

interface LibraryExplorerProps {
  /** Which shelf: the company-wide one, or one office's. */
  shelf: string;
  /** Mark the type tabs, tags and first card for the guided tour. */
  tour?: boolean;
}

/** One shelf's files: type folders, search, tags and a ranked grid. */
export function LibraryExplorer({ shelf, tour = false }: LibraryExplorerProps) {
  const pathname = usePathname();
  const { allResources, ranked, persona, stats } = useLibraryState();

  const source = useMemo(
    () => allResources.filter((resource) => resource.office === shelf),
    [allResources, shelf],
  );

  const [filters, setFilters] = useState<Filters>(emptyFilters);

  // Read the URL once on mount so shared links open with their filters applied.
  // Kept out of useSearchParams deliberately: this page needs no Suspense
  // boundary and no server render of the query string.
  useEffect(() => {
    const parsed = parseFilters(new URLSearchParams(window.location.search));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from the URL once
    setFilters({ ...parsed, office: "all" });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(toQueryString(filters));
    // The tour flag belongs to the tour, not the filters; keep it if present.
    const tourParam = new URLSearchParams(window.location.search).get("tour");
    if (tourParam) params.set("tour", tourParam);
    const query = params.toString();
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  }, [filters, pathname]);

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const resource of source) {
      for (const tag of resource.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag, count]) => ({ tag, count }));
  }, [source]);

  const visible = useMemo(() => {
    const filtered = filterResources(source, filters);
    if (filters.sort !== "foryou" && filters.sort !== "trending") {
      return filtered.map((resource) => ({ resource, reason: undefined as string | undefined }));
    }
    // "For you" ranks for the person reading; "Trending" (and a visitor's
    // "For you") ranks by the crowd.
    const entries =
      filters.sort === "foryou" ? ranked(filtered) : rankTrending(filtered, stats);
    return entries.map((entry) => ({
      resource: entry.resource,
      reason: filters.sort === "foryou" && persona ? entry.reasons[0] : undefined,
    }));
  }, [filters, persona, ranked, source, stats]);

  const folderCounts = useMemo(() => {
    const counts: Record<MediaType, number> = { book: 0, podcast: 0, video: 0, article: 0 };
    for (const resource of source) counts[resource.type] += 1;
    return counts;
  }, [source]);

  const activeFolder: FolderKey = filters.types.length === 1 ? filters.types[0] : "all";
  const activeCount = activeFilterCount(filters);
  const reset = () => setFilters({ ...emptyFilters, sort: filters.sort });

  return (
    <div className="grid grid-cols-1 gap-6">
      <FolderBar
        active={activeFolder}
        counts={folderCounts}
        total={source.length}
        onChange={(next) => setFilters({ ...filters, types: next === "all" ? [] : [next] })}
        tour={tour}
      />

      <FilterBar
        filters={filters}
        onChange={setFilters}
        tags={tagCounts}
        personaName={persona?.name.split(" ")[0] ?? null}
        tour={tour}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          <span className="font-medium text-foreground tabular-nums">{visible.length}</span> of{" "}
          {source.length} files
          {activeCount > 0 ? ` · ${activeCount} filter${activeCount === 1 ? "" : "s"}` : ""}
        </p>
        {activeCount > 0 ? (
          <Button variant="ghost" size="sm" onClick={reset}>
            Clear filters
          </Button>
        ) : null}
      </div>

      {visible.length > 0 ? (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(({ resource, reason }, index) => (
            <li key={resource.id} className="h-full">
              <ResourceCard
                resource={resource}
                reason={reason}
                tourId={tour && index === 0 ? "card" : undefined}
              />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyShelf query={filters.query} onReset={reset} />
      )}
    </div>
  );
}

function EmptyShelf({ query, onReset }: { query: string; onReset: () => void }) {
  return (
    <div className="grid place-items-center gap-3 rounded-xl border border-dashed border-border px-6 py-16 text-center">
      <p className="text-base font-medium">
        Nothing here for {query ? `“${query}”` : "that mix"}.
      </p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Try a wider filter — or open a different folder. The best finds are often in
        the one you wouldn&rsquo;t pick.
      </p>
      <Button variant="outline" onClick={onReset} className="mt-2">
        Clear filters
      </Button>
    </div>
  );
}
