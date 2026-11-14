"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpRightIcon,
  EyeIcon,
  HeartIcon,
  LockIcon,
  MessageSquareIcon,
  PlusIcon,
  StarIcon,
  TrendingUpIcon,
  XIcon,
} from "lucide-react";
import type { Resource } from "@/lib/content";
import { COMPANY_SLUG, shelfOwner } from "@/lib/offices";
import { TAGS, tagLabel, type TagId } from "@/lib/tags";
import { TYPE_NOUN } from "@/lib/media";
import { PERSONAS, getPersona } from "@/lib/personas";
import { useLibraryState } from "@/components/library-state";
import { PersonaAvatar } from "@/components/persona-avatar";
import { Cover } from "@/components/cover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const VERB: Record<Resource["type"], string> = {
  book: "Read",
  podcast: "Listen",
  video: "Watch",
  article: "Read",
};

function shelfName(resource: Resource): string {
  if (resource.office === COMPANY_SLUG) return "Company shelf";
  return shelfOwner(resource.office)?.city ?? "Office shelf";
}

export function ResourceCard({
  resource,
  reason,
  tourId,
}: {
  resource: Resource;
  /** Why it ranks here, e.g. "Matches Finance". */
  reason?: string;
  tourId?: string;
}) {
  const { stats, addedBy, addedTags } = useLibraryState();
  const live = stats(resource);
  const trending = live.trend > 0.82;
  const by = addedBy(resource.id);
  const added = new Set(addedTags(resource.id).map((entry) => entry.tag));

  return (
    <article
      data-tour={tourId}
      className="group lift relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card"
    >
      <div className="relative">
        <Cover item={resource} />
        <div className="pointer-events-none absolute top-3 left-3 flex gap-1.5">
          {by ? (
            <span className="rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium text-foreground backdrop-blur-sm">
              New from {by.name.split(" ")[0]}
            </span>
          ) : null}
          {trending ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-ember px-2 py-0.5 text-xs font-medium text-[#2a1703]">
              <TrendingUpIcon className="size-3" aria-hidden="true" />
              Trending
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-5 pt-4 pb-4">
        <p className="text-xs text-muted-foreground">
          {TYPE_NOUN[resource.type]} · {resource.length}
        </p>
        <ResourceDialog resource={resource}>
          <button
            type="button"
            className="text-left text-[1.0625rem] leading-snug font-semibold text-foreground outline-none after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
          >
            <span className="line-clamp-2">{resource.title}</span>
          </button>
        </ResourceDialog>
        <p className="text-sm text-muted-foreground">{resource.creator}</p>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {resource.blurb}
        </p>

        {reason ? (
          <p className="mt-1 text-xs font-medium text-brand-ink">{reason}</p>
        ) : null}

        <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Tags">
          {resource.tags.slice(0, 4).map((tag) => (
            <li
              key={tag}
              className={cn(
                "rounded-full border px-2 py-0.5 text-xs",
                added.has(tag)
                  ? "border-brand/35 bg-brand/8 text-brand-ink"
                  : "border-border text-muted-foreground",
              )}
            >
              {tagLabel(tag as TagId)}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border px-5 py-3 text-xs text-muted-foreground">
        <span className="truncate">{shelfName(resource)}</span>
        <span className="flex shrink-0 items-center gap-3 tabular-nums">
          <span className="inline-flex items-center gap-1" title="Views">
            <EyeIcon className="size-3.5" aria-hidden="true" />
            <span className="sr-only">Views</span>
            {live.views.toLocaleString("en-US")}
          </span>
          <span className="inline-flex items-center gap-1" title="Reviews">
            <MessageSquareIcon className="size-3.5" aria-hidden="true" />
            <span className="sr-only">Reviews</span>
            {live.reviews}
          </span>
          <LikeButton resource={resource} compact />
        </span>
      </div>
    </article>
  );
}

/** Heart + count. A visitor sees the count; a person can like. */
export function LikeButton({
  resource,
  compact = false,
}: {
  resource: Resource;
  compact?: boolean;
}) {
  const { canInteract, isLiked, toggleLike, stats } = useLibraryState();
  const liked = isLiked(resource.id);
  // Pop only in answer to a click, never when a page loads already liked.
  const [popped, setPopped] = useState(0);
  const likes = stats(resource).likes;

  if (!canInteract) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1",
          !compact && "h-10 rounded-xl border border-border px-3.5 text-sm",
        )}
        title="Pick a person to like"
      >
        <HeartIcon className={compact ? "size-3.5" : "size-4"} aria-hidden="true" />
        <span className="sr-only">Likes</span>
        {likes.toLocaleString("en-US")}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (!liked) setPopped((count) => count + 1);
        toggleLike(resource.id);
      }}
      aria-pressed={liked}
      aria-label={`${liked ? "Unlike" : "Like"} ${resource.title}, ${likes} likes`}
      className={cn(
        "press relative z-10 inline-flex items-center gap-1 tabular-nums",
        compact
          ? "-mx-1.5 rounded-md px-1.5 py-1 before:absolute before:-inset-2.5 before:content-[''] hover:bg-muted hover:text-foreground"
          : "h-10 rounded-xl border px-3.5 text-sm font-medium",
        !compact && (liked ? "border-rose-500/30 bg-rose-500/10" : "border-border hover:bg-muted"),
        liked && "text-rose-600 dark:text-rose-400",
      )}
    >
      <HeartIcon
        key={popped}
        className={cn(
          compact ? "size-3.5" : "size-4",
          liked && "fill-current",
          liked && popped > 0 && "like-pop",
        )}
        aria-hidden="true"
      />
      {compact ? likes.toLocaleString("en-US") : `${liked ? "Liked" : "Like"} · ${likes}`}
    </button>
  );
}

/** Wrap any trigger to open a file's full card. */
export function ResourceDialog({
  resource,
  children,
}: {
  resource: Resource;
  children: React.ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="gap-0 p-0 sm:max-w-xl sm:p-0">
        <ResourceDialogBody resource={resource} />
      </DialogContent>
    </Dialog>
  );
}

function ResourceDialogBody({ resource: initial }: { resource: Resource }) {
  const { allResources, markViewed, stats, addedBy, persona } = useLibraryState();
  // Read the live copy so tags added in this dialog show straight away.
  const resource = allResources.find((entry) => entry.id === initial.id) ?? initial;
  const live = stats(resource);
  const owner = shelfOwner(resource.office);
  const by = addedBy(resource.id);

  useEffect(() => {
    markViewed(resource.id);
  }, [markViewed, resource.id]);

  const recommendedBy = by
    ? `${by.name}, ${owner?.city ?? ""}`
    : resource.office === COMPANY_SLUG
      ? "The library team, for everyone"
      : `The ${owner?.name ?? ""} office`;

  return (
    <div className="grid">
      <Cover item={resource} eager className="rounded-t-2xl" />

      <div className="grid gap-6 p-6 sm:p-7">
        <header className="grid gap-2">
          <p className="text-[0.8125rem] text-muted-foreground">
            {TYPE_NOUN[resource.type]} · {resource.length} · {shelfName(resource)}
          </p>
          <DialogTitle className="font-display text-[2rem] leading-[1.08] tracking-tight">
            {resource.title}
          </DialogTitle>
          <DialogDescription className="text-[0.9375rem]">{resource.creator}</DialogDescription>
        </header>

        <p className="text-[0.9375rem] leading-relaxed text-foreground/85">{resource.blurb}</p>

        <div className="flex flex-wrap items-center gap-2">
          <LikeButton resource={resource} />
          <span className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border px-3.5 text-sm text-muted-foreground tabular-nums">
            <EyeIcon className="size-4" aria-hidden="true" />
            {live.views.toLocaleString("en-US")} views
          </span>
          <Button asChild className="ml-auto h-10 rounded-xl px-4">
            <a href={resource.url} target="_blank" rel="noopener noreferrer">
              {VERB[resource.type]} it
              <ArrowUpRightIcon className="size-4" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </Button>
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 border-y border-border py-4 text-sm">
          <dt className="text-muted-foreground">Shelf</dt>
          <dd>
            {resource.office === COMPANY_SLUG
              ? "Company shelf — not filed under any office"
              : `${owner?.name}, ${owner?.state}`}
          </dd>
          <dt className="text-muted-foreground">Recommended by</dt>
          <dd className="flex items-center gap-2">
            {by ? <PersonaAvatar persona={by} size="xs" /> : null}
            {recommendedBy}
          </dd>
          <dt className="text-muted-foreground">Added</dt>
          <dd className="tabular-nums">{formatDate(resource.addedAt)}</dd>
        </dl>

        <TagSection resource={resource} />

        <ReviewSection resource={resource} personaName={persona?.name ?? null} />
      </div>
    </div>
  );
}

function TagSection({ resource }: { resource: Resource }) {
  const { persona, canTag, addTag, removeTag, addedTags } = useLibraryState();
  const [open, setOpen] = useState(false);
  const extra = addedTags(resource.id);
  const extraByTag = new Map(extra.map((entry) => [entry.tag, entry]));
  const allowed = canTag(resource);
  const available = TAGS.filter((tag) => !resource.tags.includes(tag));
  const owner = shelfOwner(resource.office);

  return (
    <section aria-labelledby={`tags-${resource.id}`} className="grid gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 id={`tags-${resource.id}`} className="text-[0.9375rem] font-semibold">
          Tags
        </h3>
        <p className="text-xs text-muted-foreground">
          {allowed
            ? `You can tag this — it's in your ${owner?.city} office`
            : persona
              ? resource.office === COMPANY_SLUG
                ? "Company files keep their own tags"
                : `Only people in ${owner?.city} can tag this`
              : null}
        </p>
      </div>
      <ul className="flex flex-wrap gap-2">
        {resource.tags.map((tag) => {
          const added = extraByTag.get(tag);
          const who = added ? getPersona(added.personaId) : null;
          return (
            <li
              key={tag}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border py-1 pr-1 pl-3 text-[0.8125rem]",
                added ? "border-brand/35 bg-brand/8 text-brand-ink" : "border-border pr-3",
              )}
            >
              {tagLabel(tag)}
              {added ? (
                <span className="text-xs opacity-70">· {who?.name.split(" ")[0]}</span>
              ) : null}
              {added && allowed ? (
                <button
                  type="button"
                  onClick={() => removeTag(resource.id, tag)}
                  className="press grid size-5 place-items-center rounded-full hover:bg-brand/15"
                  aria-label={`Remove tag ${tagLabel(tag)}`}
                >
                  <XIcon className="size-3" aria-hidden="true" />
                </button>
              ) : null}
            </li>
          );
        })}
        {allowed ? (
          <li>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              className="press inline-flex items-center gap-1 rounded-full border border-dashed border-foreground/30 px-3 py-1 text-[0.8125rem] hover:border-foreground/60"
            >
              <PlusIcon className="size-3.5" aria-hidden="true" />
              Add tag
            </button>
          </li>
        ) : null}
      </ul>
      {allowed && open ? (
        <div className="rounded-xl bg-muted/70 p-3">
          <p className="mb-2 text-xs text-muted-foreground">Pick a tag to add</p>
          <div className="flex flex-wrap gap-1.5">
            {available.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(resource.id, tag)}
                className="press rounded-full border border-border bg-card px-2.5 py-1 text-xs hover:border-brand/50"
              >
                {tagLabel(tag)}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ReviewSection({
  resource,
  personaName,
}: {
  resource: Resource;
  personaName: string | null;
}) {
  const { reviews, addReview, setPersonaId } = useLibraryState();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [showAll, setShowAll] = useState(false);
  const list = reviews(resource);
  const average = list.length
    ? list.reduce((total, review) => total + review.rating, 0) / list.length
    : 0;
  const shown = showAll ? list : list.slice(0, 3);

  return (
    <section aria-labelledby={`reviews-${resource.id}`} className="grid gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 id={`reviews-${resource.id}`} className="text-[0.9375rem] font-semibold">
          Reviews <span className="font-normal text-muted-foreground">· {list.length}</span>
        </h3>
        {list.length > 0 ? (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground tabular-nums">
            <Stars value={Math.round(average)} />
            {average.toFixed(1)}
          </span>
        ) : null}
      </div>

      {personaName ? (
        <form
          className="grid gap-2.5 rounded-xl border border-border p-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!body.trim()) return;
            addReview(resource.id, rating, body);
            setBody("");
            setRating(5);
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Posting as {personaName}</span>
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <label className="sr-only" htmlFor={`review-${resource.id}`}>
            Your review
          </label>
          <textarea
            id={`review-${resource.id}`}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={2}
            placeholder="What stuck with you?"
            className="w-full resize-none rounded-lg bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={!body.trim()}>
              Post review
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-muted/70 px-4 py-3 text-sm">
          <LockIcon className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-muted-foreground">Visitors read reviews. Review as</span>
          <span className="flex -space-x-1">
            {PERSONAS.map((person) => (
              <button
                key={person.id}
                type="button"
                onClick={() => setPersonaId(person.id)}
                className="press rounded-full ring-2 ring-popover hover:z-10 hover:-translate-y-0.5"
                aria-label={`Review as ${person.name}`}
                title={person.name}
              >
                <PersonaAvatar persona={person} size="sm" />
              </button>
            ))}
          </span>
        </div>
      )}

      <ul className="grid gap-4">
        {shown.map((review) => (
          <li key={review.id} className="grid gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{review.author}</span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <Stars value={review.rating} />
                {formatDate(review.date)}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{review.body}</p>
          </li>
        ))}
      </ul>
      {list.length > 3 ? (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className="justify-self-start text-sm font-medium text-brand-ink hover:underline"
        >
          {showAll ? "Show fewer" : `Show all ${list.length} reviews`}
        </button>
      ) : null}
    </section>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <span role="radiogroup" aria-label="Rating" className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star === 1 ? "" : "s"}`}
          onClick={() => onChange(star)}
          className="press grid size-7 place-items-center rounded-md hover:bg-muted"
        >
          <StarIcon
            aria-hidden="true"
            className={cn("size-4", star <= value ? "fill-ember text-ember" : "text-border")}
          />
        </button>
      ))}
    </span>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`} role="img">
      {Array.from({ length: 5 }, (_, index) => (
        <StarIcon
          key={index}
          aria-hidden="true"
          className={cn("size-3", index < value ? "fill-ember text-ember" : "text-border")}
        />
      ))}
    </span>
  );
}

function formatDate(iso: string): string {
  const date = new Date(`${iso}T12:00:00Z`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
