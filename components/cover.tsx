"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MediaType } from "@/lib/catalog";
import { coverSrc } from "@/lib/covers";
import { coverColors, generatedCover } from "@/lib/cover-art";
import { cn } from "@/lib/utils";

export type CoverStatus = "loading" | "found" | "generated";

interface CoverProps {
  item: { slug: string; title: string; creator: string; type: MediaType; url: string };
  className?: string;
  /** Load straight away (dialogs, previews) instead of when scrolled near. */
  eager?: boolean;
  onStatus?: (status: CoverStatus) => void;
}

/**
 * The generated cover paints first, so a card is never blank. The real image
 * (found from the link) fades in over it once it has loaded. Portrait and
 * square art — book covers, podcast artwork — sits on a blurred copy of
 * itself rather than being cropped.
 */
export function Cover({ item, className, eager = false, onStatus }: CoverProps) {
  const fallback = useMemo(
    () => generatedCover(item),
    // Only the fields the art uses.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [item.slug, item.title, item.creator, item.type],
  );
  const src = useMemo(
    () => (item.url ? coverSrc(item) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [item.url, item.type, item.title, item.creator],
  );
  const colors = coverColors(item);
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState<{ src: string; tall: boolean } | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  const status: CoverStatus = !src || failed === src
    ? "generated"
    : loaded?.src === src
      ? "found"
      : "loading";

  useEffect(() => {
    onStatus?.(status);
  }, [onStatus, status]);

  function accept(image: HTMLImageElement) {
    if (!src) return;
    // YouTube answers a missing video with a 120×90 grey placeholder.
    if (image.naturalWidth <= 120) {
      setFailed(src);
      return;
    }
    setLoaded({ src, tall: image.naturalWidth / image.naturalHeight < 1.25 });
  }

  // An image cached by the browser can finish before React attaches onLoad.
  useEffect(() => {
    const image = imgRef.current;
    if (image?.complete && image.naturalWidth > 0) accept(image);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const showReal = status === "found" && loaded;

  return (
    <div
      className={cn("relative isolate aspect-video overflow-hidden", className)}
      style={{ backgroundColor: colors.bgDeep }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={fallback}
        alt=""
        aria-hidden="true"
        draggable={false}
        className={cn(
          "absolute inset-0 size-full object-cover transition-opacity duration-300 ease-out",
          showReal ? "opacity-0" : "opacity-100",
        )}
      />

      {src && failed !== src ? (
        <>
          {showReal && loaded.tall ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 size-full scale-125 object-cover opacity-70 blur-2xl saturate-150"
            />
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            key={src}
            src={src}
            alt={`Cover of ${item.title}`}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            referrerPolicy="no-referrer"
            draggable={false}
            onLoad={(event) => accept(event.currentTarget)}
            onError={() => setFailed(src)}
            className={cn(
              "absolute transition-opacity duration-300 ease-out",
              showReal ? "opacity-100" : "opacity-0",
              showReal && loaded.tall
                ? "inset-y-[9%] left-1/2 h-[82%] w-auto -translate-x-1/2 rounded-[3px] object-contain shadow-[0_10px_30px_-8px_rgb(0_0_0/0.55)]"
                : "inset-0 size-full object-cover",
            )}
          />
        </>
      ) : null}
    </div>
  );
}
