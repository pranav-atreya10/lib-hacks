"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toggleLike } from "@/app/actions";
import { HeartIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

/** Heart + count. Updates instantly, then confirms with the server. */
export function LikeButton({
  itemKey,
  title,
  liked,
  count,
  size = "sm",
}: {
  itemKey: string;
  title: string;
  liked: boolean;
  count: number;
  size?: "sm" | "lg";
}) {
  const [, startTransition] = useTransition();
  const [state, setOptimistic] = useOptimistic({ liked, count });
  const [popped, setPopped] = useState(0);

  return (
    <button
      type="button"
      aria-pressed={state.liked}
      aria-label={`${state.liked ? "Unlike" : "Like"} ${title}, ${state.count} likes`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!state.liked) setPopped((value) => value + 1);
        startTransition(async () => {
          setOptimistic({ liked: !state.liked, count: state.count + (state.liked ? -1 : 1) });
          await toggleLike(itemKey);
        });
      }}
      className={cn(
        "press relative z-10 inline-flex items-center gap-1 tabular-nums",
        size === "sm"
          ? "-mx-1.5 rounded-md px-1.5 py-1 text-xs before:absolute before:-inset-2.5 before:content-[''] hover:bg-muted hover:text-foreground"
          : "h-10 rounded-[6px] border px-3.5 text-sm font-medium",
        size === "lg" && (state.liked ? "border-tint-red-ink/20 bg-tint-red" : "border-border hover:bg-muted"),
        state.liked && "text-tint-red-ink",
      )}
    >
      <HeartIcon
        key={popped}
        className={cn(size === "sm" ? "size-3.5" : "size-4", state.liked && "fill-current", state.liked && popped > 0 && "like-pop")}
        aria-hidden="true"
      />
      {size === "lg" ? `${state.liked ? "Liked" : "Like"} · ${state.count}` : state.count}
    </button>
  );
}
