import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { q, one } from "@/lib/db";
import { EMPTY_STATS, companyStats, findItem, personActivity } from "@/lib/library";
import { relativeTime } from "@/lib/insights";
import { Cover } from "@/components/cover";
import { LikeButton } from "@/components/like-button";
import { PageSkeleton } from "@/components/page-header";
import { UserAvatar } from "@/components/user-avatar";
import { DeleteItemButton, RecordView, ReviewForm, TagEditor } from "@/components/app-controls";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, ArrowUpRightIcon, EyeIcon, StarIcon } from "@/components/icons";
import { TYPE_NOUN } from "@/lib/media";
import type { TagId } from "@/lib/tags";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "File" };

const VERB = { book: "Read", podcast: "Listen", video: "Watch", article: "Read" } as const;

async function ItemPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const viewer = await requireMember();
  const { companyId } = viewer.membership;
  const item = await findItem(companyId, decodeURIComponent(key));
  if (!item) notFound();

  const [stats, activity, reviews, myTags] = await Promise.all([
    companyStats(companyId),
    personActivity(companyId, viewer.id),
    q<{ id: string; rating: number; body: string; created_at: Date | string; user_id: string; name: string }>(
      `select r.id, r.rating, r.body, r.created_at, r.user_id, u.name
         from reviews r join users u on u.id = r.user_id
        where r.company_id = $1 and r.item_key = $2 order by r.created_at desc`,
      [companyId, item.key],
    ),
    q<{ tag: string }>("select tag from item_tags where company_id = $1 and item_key = $2 and (added_by = $3 or $4)", [
      companyId,
      item.key,
      viewer.id,
      viewer.membership.role === "admin",
    ]),
  ]);
  const itemStats = stats.get(item.key) ?? EMPTY_STATS;
  let canDelete = false;
  if (item.source === "custom") {
    const row = await one<{ added_by: string | null; role: string | null }>(
      `select i.added_by, lm.role from items i
         left join library_members lm on lm.library_id = i.library_id and lm.user_id = $3
        where i.id = $1 and i.company_id = $2`,
      [item.key.slice(2), companyId, viewer.id],
    );
    canDelete = row?.added_by === viewer.id || row?.role === "admin" || viewer.membership.role === "admin";
  }
  const back = item.libraries[0] ? `/app/libraries/${item.libraries[0].id}` : "/app";
  const average = reviews.length ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length : 0;

  return (
    <div className="app-page grid grid-cols-1 gap-8">
      <RecordView itemKey={item.key} />
      <Link href={back} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-3.5" aria-hidden="true" /> {item.libraries[0]?.name ?? "Home"}
      </Link>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid content-start gap-8">
          <div className="overflow-hidden rounded-xl border border-border">
            <Cover item={item} eager />
          </div>
          <header className="grid gap-2">
            <p className="text-sm text-muted-foreground">
              {TYPE_NOUN[item.type]} · {item.length}
            </p>
            <h1 className="font-display text-[2rem] leading-tight">{item.title}</h1>
            <p className="text-[0.9375rem] text-muted-foreground">{item.creator}</p>
          </header>
          <p className="text-[0.9375rem] leading-relaxed">{item.blurb}</p>
          <div className="flex flex-wrap items-center gap-2">
            <LikeButton itemKey={item.key} title={item.title} liked={activity.likes.has(item.key)} count={itemStats.likes} size="lg" />
            <span className="inline-flex h-10 items-center gap-1.5 rounded-[6px] border border-border px-3.5 text-sm text-muted-foreground tabular-nums">
              <EyeIcon className="size-4" aria-hidden="true" /> {itemStats.views} views
            </span>
            <Button asChild className="ml-auto h-10 px-4">
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                {VERB[item.type]} it <ArrowUpRightIcon className="size-4" aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </Button>
          </div>

          <section aria-labelledby="reviews" className="grid gap-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="reviews" className="text-lg font-semibold tracking-tight">
                Reviews <span className="font-normal text-muted-foreground">· {reviews.length}</span>
              </h2>
              {reviews.length ? <span className="text-sm text-muted-foreground tabular-nums">{average.toFixed(1)} average</span> : null}
            </div>
            <ReviewForm itemKey={item.key} name={viewer.name} />
            {reviews.length ? (
              <ul className="grid gap-5">
                {reviews.map((review) => (
                  <li key={review.id} className="grid gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <UserAvatar name={review.name} seed={review.user_id} size="xs" /> {review.name}
                      </span>
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex" role="img" aria-label={`${review.rating} out of 5 stars`}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarIcon key={star} className={cn("size-3", star <= review.rating ? "fill-ember text-ember" : "text-border")} aria-hidden="true" />
                          ))}
                        </span>
                        {relativeTime(new Date(review.created_at).toISOString())}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{review.body}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No reviews yet. Be the first.</p>
            )}
          </section>
        </div>

        <aside className="grid content-start gap-6">
          <section className="surface p-5">
            <h2 className="text-sm font-semibold">Details</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">In libraries</dt>
                <dd className="mt-0.5">
                  {item.libraries.length
                    ? item.libraries.map((library, index) => (
                        <span key={library.id}>
                          {index ? ", " : ""}
                          <Link href={`/app/libraries/${library.id}`} className="hover:underline">
                            {library.name}
                          </Link>
                        </span>
                      ))
                    : "Not on a shelf yet"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Recommended by</dt>
                <dd className="mt-0.5">{item.addedBy?.name ?? "Marketplace collection"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Activity</dt>
                <dd className="mt-0.5 tabular-nums">
                  {itemStats.views} views · {itemStats.likes} likes · {itemStats.reviews} reviews
                </dd>
              </div>
            </dl>
          </section>
          <section className="surface grid gap-3 p-5">
            <h2 className="text-sm font-semibold">Tags</h2>
            <TagEditor itemKey={item.key} tags={item.tags} removable={myTags.map((row) => row.tag as TagId)} />
          </section>
          {canDelete ? <DeleteItemButton itemKey={item.key} title={item.title} back={back} /> : null}
        </aside>
      </div>
    </div>
  );
}

export default function Page({ params }: PageProps<"/app/items/[key]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ItemPage params={params} />
    </Suspense>
  );
}
