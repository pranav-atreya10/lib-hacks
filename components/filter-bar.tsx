"use client";

import { SearchIcon, XIcon } from "lucide-react";
import type { Filters, SortKey } from "@/lib/filters";
import { tagLabel, type TagId } from "@/lib/tags";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  filters: Filters;
  onChange: (next: Filters) => void;
  tags: { tag: string; count: number }[];
  /** First name of the person reading, for the "For …" sort. */
  personaName: string | null;
  tour?: boolean;
}

export function FilterBar({ filters, onChange, tags, personaName, tour }: FilterBarProps) {
  const sorts: { value: SortKey; label: string }[] = [
    { value: "foryou", label: personaName ? `For ${personaName}` : "Most popular" },
    { value: "trending", label: "Trending" },
    { value: "newest", label: "Newest" },
    { value: "title", label: "A–Z" },
  ];

  function toggleTag(tag: string) {
    onChange({
      ...filters,
      tags: filters.tags.includes(tag)
        ? filters.tags.filter((value) => value !== tag)
        : [...filters.tags, tag],
    });
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={filters.query}
            onChange={(event) => onChange({ ...filters, query: event.target.value })}
            placeholder="Search titles, people, tags…"
            aria-label="Search the library"
            className="h-11 rounded-xl bg-card pl-10 text-[0.9375rem]"
          />
          {filters.query ? (
            <button
              type="button"
              onClick={() => onChange({ ...filters, query: "" })}
              className="press absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <XIcon className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <label className="sr-only" htmlFor="sort-filter">
          Sort
        </label>
        <select
          id="sort-filter"
          value={filters.sort === "office" ? "foryou" : filters.sort}
          onChange={(event) => onChange({ ...filters, sort: event.target.value as SortKey })}
          className="h-11 rounded-xl border border-input bg-card px-3 text-sm text-foreground sm:w-44"
        >
          {sorts.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {tags.length > 0 ? (
        <div data-tour={tour ? "tags" : undefined} className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-sm text-muted-foreground">Tags</span>
          {tags.map(({ tag, count }) => {
            const active = filters.tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                aria-pressed={active}
                className={cn(
                  "press rounded-full border px-3 py-1 text-[0.8125rem] whitespace-nowrap",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                )}
              >
                {tagLabel(tag as TagId)}
                <span className="ml-1.5 text-xs tabular-nums opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
