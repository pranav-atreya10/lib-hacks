import Link from "next/link";
import { EyeIcon, MessageSquareIcon, TrendingUpIcon } from "@/components/icons";
import { Cover } from "@/components/cover";
import { LikeButton } from "@/components/like-button";
import type { CardData } from "@/lib/insights";
import { TYPE_NOUN } from "@/lib/media";
import { tagLabel } from "@/lib/tags";

/** One file: cover, what it is, why it's here, and its numbers. */
export function ItemCard({ card, showReason = true }: { card: CardData; showReason?: boolean }) {
  const trending = card.stats.likesWeek + card.stats.viewsWeek >= 3;
  return (
    <article className="lift relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative">
        <Cover item={card} />
        <div className="pointer-events-none absolute top-3 left-3 flex gap-1.5">
          {card.addedBy ? (
            <span className="tag bg-card text-foreground shadow-[0_0_0_1px_var(--border)]">
              From {card.addedBy.name.split(" ")[0]}
            </span>
          ) : null}
          {trending ? (
            <span className="tag bg-tint-yellow text-tint-yellow-ink">
              <TrendingUpIcon className="size-3" aria-hidden="true" />
              Trending
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-5 pt-4 pb-4">
        <p className="text-xs text-muted-foreground">
          {TYPE_NOUN[card.type]} · {card.length}
        </p>
        <h3 className="text-[1.0625rem] leading-snug font-semibold">
          <Link
            href={`/app/items/${card.key}`}
            className="line-clamp-2 outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
          >
            {card.title}
          </Link>
        </h3>
        <p className="text-sm text-muted-foreground">{card.creator}</p>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{card.blurb}</p>
        {showReason && card.reason ? <p className="mt-1 text-xs font-medium text-brand-ink">{card.reason}</p> : null}
        <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Tags">
          {card.tags.slice(0, 3).map((tag) => (
            <li key={tag} className="tag">
              {tagLabel(tag)}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border px-5 py-3 text-xs text-muted-foreground">
        <span className="truncate">{card.libraries.map((library) => library.name).join(", ") || "Catalogue"}</span>
        <span className="flex shrink-0 items-center gap-3 tabular-nums">
          <span className="inline-flex items-center gap-1" title="Views">
            <EyeIcon className="size-3.5" aria-hidden="true" />
            <span className="sr-only">Views</span>
            {card.stats.views}
          </span>
          <span className="inline-flex items-center gap-1" title="Reviews">
            <MessageSquareIcon className="size-3.5" aria-hidden="true" />
            <span className="sr-only">Reviews</span>
            {card.stats.reviews}
          </span>
          <LikeButton itemKey={card.key} title={card.title} liked={card.liked} count={card.stats.likes} />
        </span>
      </div>
    </article>
  );
}
