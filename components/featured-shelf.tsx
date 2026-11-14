"use client";

import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
import { useTheme } from "next-themes";
import SpotlightCard from "@/components/SpotlightCard";
import type { Resource } from "@/lib/content";
import type { Office } from "@/lib/offices";
import { tagLabel, type TagId } from "@/lib/tags";
import { typeLabel } from "@/lib/media";

export function FeaturedShelf({
  items,
}: {
  items: { resource: Resource; office: Office }[];
}) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  return (
    <ul className="grid gap-3 md:grid-cols-3">
      {items.map(({ resource, office }) => (
        <li key={resource.id} className="h-full">
          <SpotlightCard
            theme={dark ? "dark" : "light"}
            spotlightColor={dark ? "rgba(107,164,245,0.4)" : "rgba(52,128,235,0.22)"}
            spotlightSize={200}
            intensity={dark ? 0.45 : 0.8}
            className="featured-plinth h-full"
          >
            <div className="flex h-full flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
                  {office.code} · {typeLabel(resource.type)}
                </span>
                <span className="text-[0.7rem] text-muted-foreground">
                  {resource.length}
                </span>
              </div>

              <div>
                <h3 className="text-[0.95rem] font-medium leading-snug">
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-brand-ink"
                  >
                    {resource.title}
                  </a>
                </h3>
                <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">
                  {resource.creator}
                </p>
              </div>

              <p className="line-clamp-3 text-[0.8125rem] leading-relaxed text-muted-foreground">
                {resource.blurb}
              </p>

              <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
                <div className="flex flex-wrap gap-1.5">
                  {resource.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border px-1.5 py-0.5 text-[0.65rem] text-muted-foreground"
                    >
                      {tagLabel(tag as TagId)}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/offices/${office.slug}`}
                  className="inline-flex items-center gap-1 text-[0.7rem] text-muted-foreground hover:text-foreground"
                >
                  {office.city} folder
                  <ArrowUpRightIcon className="size-3" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </SpotlightCard>
        </li>
      ))}
    </ul>
  );
}
