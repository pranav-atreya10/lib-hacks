"use client";

import { SearchIcon, XIcon } from "lucide-react";
import type { MediaType } from "@/lib/catalog";
import type { Filters, SortKey } from "@/lib/filters";
import { tagLabel, type TagId } from "@/lib/tags";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { typeLabel } from "@/lib/media";

interface FilterBarProps {
  filters: Filters;
  onChange: (next: Filters) => void;
  offices: { slug: string; name: string; count: number }[];
  tags: { tag: string; count: number }[];
  typeCounts: Record<MediaType, number>;
  total: number;
  lockedOffice?: string;
}

const TYPES: MediaType[] = ["book", "podcast", "video", "article"];

const SORTS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "title", label: "A–Z" },
  { value: "office", label: "By office" },
];

export function FilterBar({
  filters,
  onChange,
  offices,
  tags,
  typeCounts,
  total,
  lockedOffice,
}: FilterBarProps) {
  function toggleType(type: MediaType) {
    onChange({
      ...filters,
      types: filters.types.includes(type)
        ? filters.types.filter((value) => value !== type)
        : [...filters.types, type],
    });
  }

  function toggleTag(tag: string) {
    onChange({
      ...filters,
      tags: filters.tags.includes(tag)
        ? filters.tags.filter((value) => value !== tag)
        : [...filters.tags, tag],
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={filters.query}
            onChange={(event) => onChange({ ...filters, query: event.target.value })}
            placeholder="Search titles, people, tags…"
            aria-label="Search the library"
            className="h-9 bg-card pl-9"
          />
          {filters.query ? (
            <button
              type="button"
              onClick={() => onChange({ ...filters, query: "" })}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <XIcon className="size-3.5" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        {lockedOffice ? null : (
          <label className="sr-only" htmlFor="office-filter">
            Office
          </label>
        )}
        {lockedOffice ? null : (
          <select
            id="office-filter"
            value={filters.office}
            onChange={(event) => onChange({ ...filters, office: event.target.value })}
            className="h-9 rounded-md border border-input bg-card px-2 text-sm text-foreground sm:max-w-52"
          >
            <option value="all">All offices ({total})</option>
            {offices.map((office) => (
              <option key={office.slug} value={office.slug}>
                {office.name} ({office.count})
              </option>
            ))}
          </select>
        )}

        <label className="sr-only" htmlFor="sort-filter">
          Sort
        </label>
        <select
          id="sort-filter"
          value={filters.sort}
          onChange={(event) =>
            onChange({ ...filters, sort: event.target.value as SortKey })
          }
          className="h-9 rounded-md border border-input bg-card px-2 text-sm text-foreground"
        >
          {SORTS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange({ ...filters, types: [] })}
          aria-pressed={filters.types.length === 0}
          className={cn(
            "rounded-full border px-2.5 py-1 text-xs transition-colors",
            filters.types.length === 0
              ? "border-brand bg-brand/10 text-brand-ink"
              : "border-border text-muted-foreground hover:border-brand/50 hover:text-foreground",
          )}
        >
          Everything
        </button>
        {TYPES.map((type) => {
          const active = filters.types.includes(type);
          return (
            <button
              key={type}
              type="button"
              onClick={() => toggleType(type)}
              aria-pressed={active}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs transition-colors",
                active
                  ? "border-brand bg-brand/10 text-brand-ink"
                  : "border-border text-muted-foreground hover:border-brand/50 hover:text-foreground",
              )}
            >
              {typeLabel(type)}
              <span className="ml-1.5 font-mono text-[0.65rem] opacity-70">
                {typeCounts[type]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="fade-edge-x -mx-1 overflow-x-auto pb-1">
        <div className="flex min-w-max items-center gap-1.5 px-1">
          <span className="catalog-code pr-1">Tags</span>
          {tags.map(({ tag, count }) => {
            const active = filters.tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                aria-pressed={active}
                className={cn(
                  "rounded-[2px] border px-2 py-0.5 text-xs whitespace-nowrap transition-colors",
                  active
                    ? "border-ember bg-ember/15 text-ember-ink"
                    : "border-border text-muted-foreground hover:border-ember/60 hover:text-foreground",
                )}
              >
                {tagLabel(tag as TagId)}
                <span className="ml-1.5 font-mono text-[0.65rem] opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ClearFiltersButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} className="text-xs">
      Clear filters
    </Button>
  );
}
