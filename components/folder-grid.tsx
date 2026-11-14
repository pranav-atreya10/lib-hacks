import Link from "next/link";
import { ArrowUpRightIcon, FolderIcon, Building2Icon } from "lucide-react";
import type { MediaType } from "@/lib/catalog";
import { typeLabel } from "@/lib/media";

const NOTES: Record<MediaType, string> = {
  book: "Long reads the offices keep coming back to.",
  podcast: "Shows for the commute and the washing up.",
  video: "Talks worth an hour of your attention.",
  article: "Short pieces that change a decision.",
};

const ORDER: MediaType[] = ["book", "podcast", "video", "article"];

interface FolderGridProps {
  counts: Record<MediaType, number>;
  officeCount: number;
}

/** Top level of the home page: the shelves as folders. */
export function FolderGrid({ counts, officeCount }: FolderGridProps) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {ORDER.map((type) => (
        <li key={type}>
          <Link
            href={`/library?type=${type}`}
            className="group flex h-full flex-col justify-between gap-6 rounded-lg border border-border bg-card p-4 transition-colors hover:border-brand/45 hover:bg-muted/40"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-9 place-items-center rounded-md bg-brand/10 text-brand">
                <FolderIcon className="size-[18px]" aria-hidden="true" />
              </span>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {counts[type]}
              </span>
            </div>
            <div>
              <h3 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                {typeLabel(type)}s
                <ArrowUpRightIcon
                  aria-hidden="true"
                  className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                />
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {NOTES[type]}
              </p>
            </div>
          </Link>
        </li>
      ))}

      <li>
        <Link
          href="/offices"
          className="group flex h-full flex-col justify-between gap-6 rounded-lg border border-border bg-card p-4 transition-colors hover:border-brand/45 hover:bg-muted/40"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="grid size-9 place-items-center rounded-md bg-ember/15 text-ember-ink">
              <Building2Icon className="size-[18px]" aria-hidden="true" />
            </span>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {officeCount}
            </span>
          </div>
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              Offices
              <ArrowUpRightIcon
                aria-hidden="true"
                className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
              />
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              One folder per office shelf.
            </p>
          </div>
        </Link>
      </li>
    </ul>
  );
}
