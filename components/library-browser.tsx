"use client";

import { useMemo, useState } from "react";
import { BookOpenIcon, FileTextIcon, LayersIcon, MicIcon, PlayIcon } from "@/components/icons";
import { FilterBar } from "@/components/filter-bar";
import { ItemCard } from "@/components/item-card";
import { Button } from "@/components/ui/button";
import { activeFilterCount, applyFilters, emptyFilters, type Filters } from "@/lib/filters";
import type { CardData } from "@/lib/insights";
import type { MediaType } from "@/lib/catalog";
import { cn } from "@/lib/utils";

const TYPE_TABS: { key: MediaType | "all"; label: string; icon: typeof BookOpenIcon }[] = [
  { key: "all", label: "All files", icon: LayersIcon },
  { key: "book", label: "Books", icon: BookOpenIcon },
  { key: "podcast", label: "Podcasts", icon: MicIcon },
  { key: "video", label: "Videos", icon: PlayIcon },
  { key: "article", label: "Articles", icon: FileTextIcon },
];

/** Search, type tabs, tags and sort over a set of files. */
export function LibraryBrowser({
  cards,
  firstName,
  empty,
}: {
  cards: CardData[];
  firstName: string;
  empty?: React.ReactNode;
}) {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const visible = useMemo(() => applyFilters(cards, filters), [cards, filters]);

  const counts = useMemo(() => {
    const result: Record<MediaType, number> = { book: 0, podcast: 0, video: 0, article: 0 };
    for (const card of cards) result[card.type] += 1;
    return result;
  }, [cards]);

  const tags = useMemo(() => {
    const map = new Map<string, number>();
    for (const card of cards) for (const tag of card.tags) map.set(tag, (map.get(tag) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([tag, count]) => ({ tag, count }));
  }, [cards]);

  if (cards.length === 0) return <>{empty}</>;

  const activeType = filters.types.length === 1 ? filters.types[0] : "all";

  return (
    <div className="grid grid-cols-1 gap-6">
      <nav aria-label="File types" className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
        <div className="inline-flex min-w-max gap-1 rounded-lg border border-border bg-muted/60 p-1">
          {TYPE_TABS.map(({ key, label, icon: Icon }) => {
            const selected = activeType === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={selected}
                onClick={() => setFilters({ ...filters, types: key === "all" ? [] : [key] })}
                className={cn(
                  "press flex items-center gap-2 rounded-[6px] px-3 py-1.5 text-sm font-medium",
                  selected ? "bg-card shadow-[0_0_0_1px_var(--border)]" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4 opacity-70" aria-hidden="true" />
                {label}
                <span className="text-xs font-normal text-muted-foreground tabular-nums">
                  {key === "all" ? cards.length : counts[key]}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <FilterBar filters={filters} onChange={setFilters} tags={tags} personaName={firstName} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          <span className="font-medium text-foreground tabular-nums">{visible.length}</span> of {cards.length} files
        </p>
        {activeFilterCount(filters) > 0 ? (
          <Button variant="ghost" size="sm" onClick={() => setFilters({ ...emptyFilters, sort: filters.sort })}>
            Clear filters
          </Button>
        ) : null}
      </div>

      {visible.length > 0 ? (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((card) => (
            <li key={card.key} className="h-full">
              <ItemCard card={card} showReason={filters.sort === "foryou"} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid place-items-center gap-3 rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <p className="font-medium">Nothing matches that.</p>
          <Button variant="outline" onClick={() => setFilters({ ...emptyFilters, sort: filters.sort })}>
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
