"use client";

import { useState } from "react";
import { TrashIcon } from "@/components/icons";
import { useLibraryState } from "@/components/library-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Delete a file you recommended. Shown only to the person who added it, and
 * always asks once before anything is removed.
 */
export function DeleteResource({
  resourceId,
  title,
  onDeleted,
  compact = false,
}: {
  resourceId: string;
  title: string;
  onDeleted?: () => void;
  /** A small icon button (for lists) instead of the full panel. */
  compact?: boolean;
}) {
  const { canDelete, deleteResource } = useLibraryState();
  const [confirming, setConfirming] = useState(false);
  if (!canDelete(resourceId)) return null;

  function confirm() {
    if (deleteResource(resourceId)) onDeleted?.();
  }

  if (compact) {
    return confirming ? (
      <span className="flex shrink-0 items-center gap-1">
        <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
        <Button
          size="sm"
          className="bg-tint-red-ink text-white hover:bg-tint-red-ink/90"
          onClick={confirm}
          aria-label={`Confirm delete ${title}`}
        >
          Delete
        </Button>
      </span>
    ) : (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="press grid size-8 shrink-0 place-items-center rounded-[6px] text-muted-foreground hover:bg-tint-red hover:text-tint-red-ink"
        aria-label={`Delete ${title}`}
        title="Delete"
      >
        <TrashIcon className="size-4" aria-hidden="true" />
      </button>
    );
  }

  return (
    <section
      aria-labelledby={`delete-${resourceId}`}
      className={cn(
        "grid gap-3 rounded-lg border p-4",
        confirming ? "border-tint-red-ink/30 bg-tint-red" : "border-border",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 id={`delete-${resourceId}`} className="text-sm font-semibold">
            {confirming ? "Delete this recommendation?" : "You added this"}
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {confirming
              ? "It leaves the shelf for everyone, with its likes, reviews and tags."
              : "Only you can remove it from the shelf."}
          </p>
        </div>
        {confirming ? (
          <span className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-tint-red-ink text-white hover:bg-tint-red-ink/90"
              onClick={confirm}
            >
              <TrashIcon className="size-3.5" aria-hidden="true" />
              Delete
            </Button>
          </span>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="text-tint-red-ink hover:bg-tint-red hover:text-tint-red-ink"
            onClick={() => setConfirming(true)}
          >
            <TrashIcon className="size-3.5" aria-hidden="true" />
            Delete
          </Button>
        )}
      </div>
    </section>
  );
}
