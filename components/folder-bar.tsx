"use client";

import { BookOpenIcon, FileTextIcon, LayersIcon, MicIcon, PlayIcon } from "@/components/icons";
import type { MediaType } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export type FolderKey = MediaType | "all";

const FOLDERS: { key: FolderKey; label: string; icon: typeof BookOpenIcon }[] = [
  { key: "all", label: "All files", icon: LayersIcon },
  { key: "book", label: "Books", icon: BookOpenIcon },
  { key: "podcast", label: "Podcasts", icon: MicIcon },
  { key: "video", label: "Videos", icon: PlayIcon },
  { key: "article", label: "Articles", icon: FileTextIcon },
];

interface FolderBarProps {
  active: FolderKey;
  counts: Record<MediaType, number>;
  total: number;
  onChange: (next: FolderKey) => void;
  tour?: boolean;
}

/** The four kinds of file, as one segmented row. */
export function FolderBar({ active, counts, total, onChange, tour }: FolderBarProps) {
  return (
    <nav
      aria-label="Folders"
      data-tour={tour ? "types" : undefined}
      className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0"
    >
      <div className="inline-flex min-w-max gap-1 rounded-lg border border-border bg-muted/60 p-1">
        {FOLDERS.map(({ key, label, icon: Icon }) => {
          const selected = active === key;
          const count = key === "all" ? total : counts[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              aria-pressed={selected}
              className={cn(
                "press flex items-center gap-2 rounded-[6px] px-3 py-1.5 text-sm font-medium",
                selected
                  ? "bg-card text-foreground shadow-[0_0_0_1px_var(--border)]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon aria-hidden="true" className="size-4 opacity-70" />
              {label}
              <span className="text-xs font-normal text-muted-foreground tabular-nums">{count}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
