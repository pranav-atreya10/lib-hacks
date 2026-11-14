"use client";

import { ArrowUpRightIcon } from "lucide-react";
import type { Resource } from "@/lib/content";
import type { Office } from "@/lib/offices";
import { tagLabel, type TagId } from "@/lib/tags";
import { TYPE_NOUN, catalogCode, typeLabel } from "@/lib/media";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function ResourceCard({ resource, office }: { resource: Resource; office: Office }) {
  const code = catalogCode(office.code, resource.type, resource.ordinal);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "group relative flex h-full w-full flex-col gap-4 overflow-hidden rounded-[3px] border border-border bg-card p-4 text-left",
            "transition-colors duration-150 hover:border-brand/70",
            "focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          )}
        >
          {resource.featured ? (
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-[3px] bg-ember"
            />
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <span className="catalog-code">{code}</span>
            <span className="catalog-code text-ember-ink dark:text-ember-ink">
              {resource.length}
            </span>
          </div>

          <div className="flex-1">
            <h3 className="font-heading text-[1.15rem] leading-snug text-foreground">
              {resource.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{resource.creator}</p>
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              {resource.blurb}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {resource.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-[2px] border border-border px-1.5 py-0.5 text-[0.7rem] text-muted-foreground group-hover:border-brand/40"
              >
                {tagLabel(tag as TagId)}
              </span>
            ))}
          </div>
        </button>
      </DialogTrigger>

      <DialogContent className="gap-5 sm:max-w-lg">
        <DialogHeader className="gap-2">
          <span className="catalog-code">{code}</span>
          <DialogTitle className="font-heading text-2xl leading-tight">
            {resource.title}
          </DialogTitle>
          <DialogDescription>
            {resource.creator} · {TYPE_NOUN[resource.type]} · {resource.length}
          </DialogDescription>
        </DialogHeader>

        <p className="text-[0.95rem] leading-relaxed text-foreground/90">
          {resource.blurb}
        </p>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-[3px] border border-border bg-muted/40 p-3 text-sm">
          <dt className="catalog-code pt-0.5">Office</dt>
          <dd>
            {office.name}, {office.state}
            {office.phone ? (
              <span className="block text-xs text-muted-foreground">{office.phone}</span>
            ) : null}
          </dd>
          <dt className="catalog-code pt-0.5">Tags</dt>
          <dd className="flex flex-wrap gap-1.5">
            {resource.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-[2px] border border-border bg-card px-1.5 py-0.5 text-xs"
              >
                {tagLabel(tag as TagId)}
              </span>
            ))}
          </dd>
          <dt className="catalog-code pt-0.5">Added</dt>
          <dd className="font-mono text-xs text-muted-foreground">{resource.addedAt}</dd>
        </dl>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild className="gap-1.5">
            <a href={resource.url} target="_blank" rel="noopener noreferrer">
              Open {TYPE_NOUN[resource.type].toLowerCase()}
              <ArrowUpRightIcon className="size-4" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </Button>
          <p className="text-xs text-muted-foreground">
            Recommended by the {office.city} office
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
