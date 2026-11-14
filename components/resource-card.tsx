"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpRightIcon,
  EyeIcon,
  HeartIcon,
  MessageSquareIcon,
  StarIcon,
} from "lucide-react";
import type { Resource } from "@/lib/content";
import type { Office } from "@/lib/offices";
import { tagLabel, type TagId } from "@/lib/tags";
import { TYPE_NOUN, catalogCode, typeLabel } from "@/lib/media";
import { useLibraryState } from "@/components/library-state";
import { seedReviews } from "@/lib/engagement";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ResourceCard({ resource, office }: { resource: Resource; office: Office }) {
  const code = catalogCode(office.code, resource.type, resource.ordinal);
  const { stats } = useLibraryState();
  const base = stats(resource);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "group flex h-full w-full flex-col gap-3 rounded-lg border border-border bg-card p-4 text-left",
            "transition-colors duration-150 hover:border-brand/40 hover:bg-muted/40",
            "focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <span className="grid size-8 place-items-center rounded-md bg-muted text-[0.6rem] font-medium text-muted-foreground group-hover:bg-card">
              {TYPE_NOUN[resource.type].slice(0, 2).toUpperCase()}
            </span>
            <div className="flex items-center gap-2">
              {resource.featured ? (
                <span className="rounded-full bg-ember/15 px-1.5 py-0.5 text-[0.6rem] font-medium tracking-wide text-ember-ink uppercase">
                  Pinned
                </span>
              ) : null}
              <span className="text-[0.7rem] text-muted-foreground">{resource.length}</span>
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-[0.95rem] font-medium leading-snug text-foreground">
              {resource.title}
            </h3>
            <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">{resource.creator}</p>
            <p className="mt-2 line-clamp-2 text-[0.8125rem] leading-relaxed text-muted-foreground">
              {resource.blurb}
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-border pt-2.5">
            <span className="flex items-center gap-2.5 text-[0.7rem] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <EyeIcon className="size-3" aria-hidden="true" />
                {base.views.toLocaleString("en-US")}
              </span>
              <span className="inline-flex items-center gap-1">
                <HeartIcon className="size-3" aria-hidden="true" />
                {base.likes.toLocaleString("en-US")}
              </span>
            </span>
            <span className="flex gap-1">
              {resource.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border px-1.5 py-0.5 text-[0.65rem] text-muted-foreground"
                >
                  {tagLabel(tag as TagId)}
                </span>
              ))}
            </span>
          </div>
        </button>
      </DialogTrigger>

      <DialogContent className="gap-5 sm:max-w-lg">
        <ResourceDialogBody resource={resource} office={office} code={code} />
      </DialogContent>
    </Dialog>
  );
}

function ResourceDialogBody({
  resource,
  office,
  code,
}: {
  resource: Resource;
  office: Office;
  code: string;
}) {
  const { persona, engagement, toggleLike, markViewed, addReview, stats } =
    useLibraryState();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [posted, setPosted] = useState(false);

  useEffect(() => {
    markViewed(resource.id);
  }, [markViewed, resource.id]);

  const live = stats(resource);
  const liked = engagement.likes.includes(resource.id);
  const localReviews = engagement.reviews.filter(
    (review) => review.resourceId === resource.id,
  );
  const seedCount = Math.max(0, live.reviews - localReviews.length);

  return (
    <>
      <DialogHeader className="gap-1.5">
        <span className="catalog-code">{code}</span>
        <DialogTitle className="text-xl leading-tight font-semibold">
          {resource.title}
        </DialogTitle>
        <DialogDescription className="text-[0.8125rem]">
          {resource.creator} · {TYPE_NOUN[resource.type]} · {resource.length}
        </DialogDescription>
      </DialogHeader>

      <p className="text-sm leading-relaxed text-foreground/90">{resource.blurb}</p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => toggleLike(resource.id)}
          aria-pressed={liked}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[0.8125rem] transition-colors",
            liked
              ? "border-brand/40 bg-brand/10 text-brand-ink"
              : "border-border text-muted-foreground hover:border-brand/40 hover:text-foreground",
          )}
        >
          <HeartIcon
            className={cn("size-3.5", liked && "fill-current")}
            aria-hidden="true"
          />
          {liked ? "Liked" : "Like"}
          <span className="font-mono text-[0.7rem] tabular-nums opacity-70">
            {live.likes}
          </span>
        </button>
        <span className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-[0.8125rem] text-muted-foreground">
          <EyeIcon className="size-3.5" aria-hidden="true" />
          {live.views.toLocaleString("en-US")} views
        </span>
        <span className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-[0.8125rem] text-muted-foreground">
          <MessageSquareIcon className="size-3.5" aria-hidden="true" />
          {live.reviews} reviews
        </span>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-md border border-border bg-muted/50 p-3 text-[0.8125rem]">
        <dt className="text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">
          Office
        </dt>
        <dd>
          {office.name}, {office.state}
          {office.phone ? (
            <span className="block text-xs text-muted-foreground">{office.phone}</span>
          ) : null}
        </dd>
        <dt className="text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">
          Tags
        </dt>
        <dd className="flex flex-wrap gap-1.5">
          {resource.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border bg-card px-1.5 py-0.5 text-xs"
            >
              {tagLabel(tag as TagId)}
            </span>
          ))}
        </dd>
        <dt className="text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">
          Added
        </dt>
        <dd className="font-mono text-xs text-muted-foreground">{resource.addedAt}</dd>
      </dl>

      <section className="space-y-3 border-t border-border pt-4" aria-label="Reviews">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold">Reviews</h3>
          <span className="text-[0.7rem] text-muted-foreground">
            {seedCount} from other offices
          </span>
        </div>

        <ul className="space-y-2.5">
          {localReviews.slice(0, 2).map((review) => (
            <li key={review.id} className="rounded-md border border-brand/25 bg-brand/5 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[0.8125rem] font-medium">{review.author}</span>
                <Stars value={review.rating} />
              </div>
              <p className="mt-1 text-[0.8125rem] leading-relaxed text-foreground/90">
                {review.body}
              </p>
            </li>
          ))}
          <SeedReviews resource={resource} skip={localReviews.length} />
        </ul>

        {posted ? (
          <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-[0.8125rem] text-muted-foreground">
            Thanks — your review is on this file and counts toward your ranking.
          </p>
        ) : (
          <form
            className="space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!body.trim()) return;
              addReview(resource.id, rating, body);
              setBody("");
              setPosted(true);
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor={`rating-${resource.id}`}
                className="text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase"
              >
                Rate it
              </label>
              <select
                id={`rating-${resource.id}`}
                value={rating}
                onChange={(event) => setRating(Number(event.target.value))}
                className="h-7 rounded-md border border-input bg-background px-1.5 text-xs"
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value} star{value === 1 ? "" : "s"}
                  </option>
                ))}
              </select>
            </div>
            <label className="sr-only" htmlFor={`review-${resource.id}`}>
              Your review
            </label>
            <textarea
              id={`review-${resource.id}`}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={2}
              placeholder={`Review as ${persona.name.split(" ")[0]}…`}
              className="w-full resize-none rounded-md border border-input bg-background px-2.5 py-2 text-[0.8125rem] outline-none focus-visible:border-brand"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[0.7rem] text-muted-foreground">
                Posting as {persona.name}
              </span>
              <Button type="submit" size="sm" className="h-8 px-3 text-[0.8125rem]">
                Post review
              </Button>
            </div>
          </form>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild className="h-9 gap-1.5 px-3 text-[0.8125rem]">
          <a href={resource.url} target="_blank" rel="noopener noreferrer">
            Open {TYPE_NOUN[resource.type].toLowerCase()}
            <ArrowUpRightIcon className="size-3.5" aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </Button>
        <p className="text-xs text-muted-foreground">
          From the {office.city} shelf · {typeLabel(resource.type)}
        </p>
      </div>
    </>
  );
}

function SeedReviews({ resource, skip }: { resource: Resource; skip: number }) {
  const reviews = seedReviews(resource).slice(skip, skip + 2);
  return (
    <>
      {reviews.map((review) => (
        <li key={review.id} className="rounded-md border border-border p-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[0.8125rem] font-medium">{review.author}</span>
            <Stars value={review.rating} />
          </div>
          <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted-foreground">
            {review.body}
          </p>
        </li>
      ))}
    </>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <StarIcon
          key={index}
          aria-hidden="true"
          className={cn(
            "size-2.5",
            index < value ? "fill-ember text-ember" : "text-border",
          )}
        />
      ))}
    </span>
  );
}
