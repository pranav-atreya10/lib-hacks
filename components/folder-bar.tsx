"use client";

import { FolderIcon, FolderOpenIcon } from "lucide-react";
import type { MediaType } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export type FolderKey = MediaType | "all";

const FOLDERS: { key: FolderKey; label: string }[] = [
  { key: "all", label: "All files" },
  { key: "book", label: "Books" },
  { key: "podcast", label: "Podcasts" },
  { key: "video", label: "Videos" },
  { key: "article", label: "Articles" },
];

interface FolderBarProps {
  active: FolderKey;
  counts: Record<MediaType, number>;
  total: number;
  onChange: (next: FolderKey) => void;
}

/**
 * The folders are the top level of the app: one row of tabs, one open folder at
 * a time, the way a file browser behaves.
 */
export function FolderBar({ active, counts, total, onChange }: FolderBarProps) {
  return (
    <nav aria-label="Folders" className="flex flex-wrap items-end gap-1 border-b border-border">
      {FOLDERS.map(({ key, label }) => {
        const selected = active === key;
        const Icon = selected ? FolderOpenIcon : FolderIcon;
        const count = key === "all" ? total : counts[key];
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={selected}
            className={cn(
              "-mb-px flex items-center gap-2 rounded-t-lg border border-b-0 px-3 py-2 text-[0.8125rem] transition-colors",
              selected
                ? "border-border border-b-background bg-card text-foreground"
                : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon
              aria-hidden="true"
              className={cn("size-4", selected ? "text-brand" : "opacity-60")}
            />
            {label}
            <span className="font-mono text-[0.65rem] tabular-nums opacity-60">
              {count}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
