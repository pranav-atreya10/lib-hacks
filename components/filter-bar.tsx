"use client";

import { SearchIcon, XIcon } from "lucide-react";
import type { Filters, SortKey } from "@/lib/filters";
import { tagLabel, type TagId } from "@/lib/tags";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  filters: Filters;
  onChange: (next: Filters) => void;
  offices: { slug: string; name: string; count: number }[];
  tags: { tag: string; count: number }[];
  total: number;
  lockedOffice?: string;
}

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
  total,
  lockedOffice,
}: FilterBarProps) {
  function toggleTag(tag: string) {
    onChange({
      ...filters,
      tags: filters.tags.includes(tag)
        ? filters.tags.filter((value) => value !== tag)
        : [...filters.tags, tag],
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={filters.query}
            onChange={(event) => onChange({ ...filters, query: event.target.value })}
            placeholder="Search files, people, tags…"
            aria-label="Search the library"
            className="h-8 bg-background pl-8 text-[0.8125rem]"
          />
          {filters.query ? (
            <button
              type="button"
              onClick={() => onChange({ ...filters, query: "" })}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <XIcon className="size-3.5" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        {lockedOffice ? null : (
          <>
            <label className="sr-only" htmlFor="office-filter">
              Office
            </label>
            <select
              id="office-filter"
              value={filters.office}
              onChange={(event) => onChange({ ...filters, office: event.target.value })}
              className="h-8 rounded-md border border-input bg-background px-2 text-[0.8125rem] text-foreground sm:max-w-56"
            >
              <option value="all">All offices ({total})</option>
              {offices.map((office) => (
                <option key={office.slug} value={office.slug}>
                  {office.name} ({office.count})
                </option>
              ))}
            </select>
          </>
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
          className="h-8 rounded-md border border-input bg-background px-2 text-[0.8125rem] text-foreground"
        >
          {SORTS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="fade-edge-x -mx-1 overflow-x-auto pb-1">
        <div className="flex min-w-max items-center gap-1.5 px-1">
          <span className="pr-1 text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
            Tags
          </span>
          {tags.map(({ tag, count }) => {
            const active = filters.tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                aria-pressed={active}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-xs whitespace-nowrap transition-colors",
                  active
                    ? "border-brand/40 bg-brand/10 text-brand-ink"
                    : "border-border text-muted-foreground hover:border-ember/60 hover:text-foreground",
                )}
              >
                {tagLabel(tag as TagId)}
                <span className="ml-1.5 font-mono text-[0.65rem] tabular-nums opacity-60">
                  {count}
                </span>
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
