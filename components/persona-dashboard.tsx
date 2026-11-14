"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRightIcon,
  EyeIcon,
  FolderIcon,
  HeartIcon,
  MessageSquareIcon,
  PenLineIcon,
  PlusIcon,
  SparklesIcon,
  TrendingUpIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import { useLibraryState } from "@/components/library-state";
import { RESOURCES, typeCounts } from "@/lib/content";
import { getPersona, initials, type Persona } from "@/lib/personas";
import { officeBySlug, offices } from "@/lib/offices";
import {
  addedToResource,
  emptyEngagement,
  outsideBubble,
  rankResources,
  type PersonaEngagement,
  type RankedResource,
} from "@/lib/personalize";
import { TAGS, tagLabel, type TagId } from "@/lib/tags";
import { TYPE_NOUN, typeLabel } from "@/lib/media";
import type { MediaType } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TYPES: MediaType[] = ["book", "podcast", "video", "article"];
const VISIBLE_ROWS = 12;

export function PersonaDashboard({ personaId }: { personaId: string }) {
  const {
    persona,
    personaId: activeId,
    hydrated,
    engagement,
    people,
    allResources,
    toggleLike,
  } = useLibraryState();

  const owner = getPersona(personaId);
  const isSelf = activeId === personaId;

  const [showAll, setShowAll] = useState(false);
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  // Reading someone else's shelf never changes who you are: use their saved
  // activity for the ranking, but keep your identity for the picker and actions.
  const ownerEngagement: PersonaEngagement = isSelf
    ? engagement
    : owner
      ? (people[personaId] ?? emptyEngagement)
      : emptyEngagement;

  const ownerResources = useMemo(
    () =>
      isSelf
        ? allResources
        : [...ownerEngagement.added.map(addedToResource), ...RESOURCES],
    [allResources, isSelf, ownerEngagement.added],
  );

  const shelf = useMemo(
    () => (owner ? rankResources(ownerResources, owner, ownerEngagement) : []),
    [owner, ownerEngagement, ownerResources],
  );

  const bubble = useMemo(
    () => (owner ? outsideBubble(owner, RESOURCES, 3) : []),
    [owner],
  );

  if (!owner) {
    return (
      <div className="page-shell py-16 text-sm text-muted-foreground">
        That shelf doesn&rsquo;t exist yet.{" "}
        <Link href="/people" className="text-brand-ink underline">
          See all people
        </Link>
        .
      </div>
    );
  }

  const office = officeBySlug.get(owner.office);
  const types = typeCounts();
  const rows = showAll ? shelf : shelf.slice(0, VISIBLE_ROWS);

  const likedCount = ownerEngagement.likes.length;
  const reviewCount = ownerEngagement.reviews.length;
  const addedCount = ownerEngagement.added.length;
  const viewedCount = Object.values(ownerEngagement.views).reduce(
    (total, count) => total + count,
    0,
  );
  const ownerFirst = owner.name.split(" ")[0];

  return (
    <div className="page-shell py-8 sm:py-10">
      {isSelf ? null : (
        <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-border bg-muted/40 px-3 py-2 text-[0.8125rem]">
          <Avatar persona={persona} size="sm" />
          <span>
            You&rsquo;re reading <strong>{owner.name}</strong>&rsquo;s shelf as{" "}
            <strong>{persona.name}</strong>.
          </span>
          <Link href={`/people/${activeId}`} className="text-brand-ink underline">
            Back to your shelf
          </Link>
          <span className="text-muted-foreground">
            Only the picker changes who you are.
          </span>
        </div>
      )}

      <PersonaHeader persona={owner} officeName={office?.name ?? ""} />

      <div className="mt-6 grid gap-3 sm:grid-cols-[1.4fr_1fr]">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
            {isSelf ? "From your dashboard" : `From ${ownerFirst}'s dashboard`}
          </p>
          <p className="mt-1.5 text-[0.95rem] leading-relaxed">
            {isSelf ? (
              <>
                Hey {ownerFirst}, did you know{" "}
                <span className="font-semibold">{types.article} articles</span> and{" "}
                <span className="font-semibold">{types.book} books</span> have been
                added across {RESOURCES.length} files and {offices.length} offices?
              </>
            ) : (
              <>
                {ownerFirst}&rsquo;s shelf draws from{" "}
                <span className="font-semibold">{types.article} articles</span> and{" "}
                <span className="font-semibold">{types.book} books</span> across{" "}
                {RESOURCES.length} files and {offices.length} offices.
              </>
            )}
          </p>
          <p className="mt-2 text-[0.8125rem] text-muted-foreground">
            {isSelf
              ? "Your shelf is ranked by your interests, your office, and what you like and review."
              : `${ownerFirst}'s ranking uses their interests and office. Your likes and files stay on your own shelf.`}{" "}
            {hydrated ? "" : "Loading saved history…"}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-3">
          <Metric label="Views logged" value={viewedCount} />
          <Metric label="Likes given" value={likedCount} />
          <Metric label="Reviews written" value={reviewCount} />
          <Metric label="Files added" value={addedCount} />
        </dl>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <section aria-labelledby="shelf-heading">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="shelf-heading" className="text-sm font-semibold">
                {ownerFirst}&rsquo;s shelf, ranked
              </h2>
              <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">
                {shelf.length} files · ranked for {owner.traits.join(" · ")}
              </p>
            </div>
            {isSelf ? (
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 px-2.5 text-[0.8125rem]"
                onClick={() => setAdding((open) => !open)}
              >
                {adding ? (
                  <XIcon className="size-3.5" aria-hidden="true" />
                ) : (
                  <PlusIcon className="size-3.5" aria-hidden="true" />
                )}
                {adding ? "Close" : "Add a file"}
              </Button>
            ) : null}
          </div>

          {adding ? (
            <AddResourceForm
              onAdded={(title) => {
                setJustAdded(title);
                setAdding(false);
              }}
            />
          ) : null}

          {justAdded ? (
            <div className="mt-3 rounded-md border border-brand/30 bg-brand/5 px-3 py-2 text-[0.8125rem]">
              <span className="font-medium">{justAdded}</span> is in your folder and
              sits at the top of your ranking. It is also in{" "}
              <Link href="/library" className="text-brand-ink underline">
                the library folder
              </Link>{" "}
              for this browser.
            </div>
          ) : null}

          <ol className="mt-4 space-y-2">
            {rows.map((entry, index) => (
              <ShelfRow
                key={entry.resource.id}
                entry={entry}
                rank={index + 1}
                interactive={isSelf}
                liked={ownerEngagement.likes.includes(entry.resource.id)}
                onLike={() => toggleLike(entry.resource.id)}
              />
            ))}
          </ol>

          {shelf.length > VISIBLE_ROWS ? (
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 h-8 text-[0.8125rem]"
              onClick={() => setShowAll((value) => !value)}
            >
              {showAll ? "Show fewer" : `Show all ${shelf.length} ranked files`}
            </Button>
          ) : null}
        </section>

        <aside className="space-y-6">
          <section aria-labelledby="bubble-heading">
            <div className="flex items-center gap-2">
              <SparklesIcon className="size-4 text-ember" aria-hidden="true" />
              <h2 id="bubble-heading" className="text-sm font-semibold">
                Outside {isSelf ? "your" : `${ownerFirst}'s`} bubble
              </h2>
            </div>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted-foreground">
              Files other people rank highly that {isSelf ? "your" : "their"} tags
              never touch. Push out of your comfort zone, unlike social media.
            </p>
            <ul className="mt-3 space-y-2">
              {bubble.map(({ persona: other, entry }) => (
                <li
                  key={`${entry.resource.id}-${other.id}`}
                  className="rounded-lg border border-border bg-card p-3"
                >
                  <Link
                    href={`/people/${other.id}`}
                    className="flex items-center gap-1.5 text-[0.7rem] text-muted-foreground hover:text-foreground"
                  >
                    <Avatar persona={other} size="sm" />
                    <span>
                      {other.name.split(" ")[0]} · {other.role.toLowerCase()}
                    </span>
                  </Link>
                  <a
                    href={entry.resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block text-[0.8125rem] font-medium leading-snug hover:text-brand-ink"
                  >
                    {entry.resource.title}
                  </a>
                  <p className="mt-0.5 text-[0.7rem] text-muted-foreground">
                    {tagLabel(entry.resource.tags[0])} · {typeLabel(entry.resource.type)}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {ownerEngagement.added.length > 0 ? (
            <section aria-labelledby="added-heading">
              <h2 id="added-heading" className="text-sm font-semibold">
                Files {isSelf ? "you" : `${ownerFirst}`} added
              </h2>
              <ul className="mt-2 space-y-1.5">
                {ownerEngagement.added.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-[0.8125rem]"
                  >
                    <span className="min-w-0 truncate">{item.title}</span>
                    <span className="shrink-0 text-[0.7rem] text-muted-foreground">
                      {TYPE_NOUN[item.type]}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="rounded-lg border border-dashed border-border p-3">
            <div className="flex items-center gap-2 text-[0.8125rem] font-medium">
              <UsersIcon className="size-4 text-brand" aria-hidden="true" />
              {isSelf ? "Read as someone else" : "Every shelf is open"}
            </div>
            <p className="mt-1 text-[0.75rem] leading-relaxed text-muted-foreground">
              {isSelf
                ? "A kid in Austin is into cell biology. A copywriter in Atlanta reads humanities. Open their shelf and see what changes."
                : `You are still ${persona.name}. Pick a different person from the header picker, or open your own shelf.`}
            </p>
            <Link
              href={isSelf ? "/people" : `/people/${activeId}`}
              className="mt-2 inline-flex items-center gap-1 text-[0.8125rem] text-brand-ink hover:underline"
            >
              {isSelf ? "See everyone’s shelves" : "Go to your own shelf"}
              <ArrowUpRightIcon className="size-3" aria-hidden="true" />
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}

function PersonaHeader({ persona, officeName }: { persona: Persona; officeName: string }) {
  const office = officeBySlug.get(persona.office);
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <Avatar persona={persona} size="lg" />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl leading-tight font-semibold tracking-tight">
              {persona.name}
            </h1>
            <span className="rounded-full border border-border px-1.5 py-0.5 text-[0.65rem] text-muted-foreground">
              {persona.age}
            </span>
          </div>
          <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">
            {persona.role} · {officeName}, {office?.state}
          </p>
          <p className="mt-2 max-w-xl text-[0.8125rem] leading-relaxed text-muted-foreground">
            {persona.blurb}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {persona.interests.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-brand/10 px-2 py-0.5 text-[0.7rem] text-brand-ink"
              >
                {tagLabel(tag)}
              </span>
            ))}
            {persona.traits.map((trait) => (
              <span
                key={trait}
                className="rounded-full border border-border px-2 py-0.5 text-[0.7rem] text-muted-foreground"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>
      </div>
      <blockquote className="max-w-xs rounded-lg border border-border bg-muted/40 p-3 text-[0.8125rem] italic text-muted-foreground">
        “{persona.motto}”
      </blockquote>
    </header>
  );
}

function Avatar({ persona, size }: { persona: Persona; size: "sm" | "lg" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-semibold text-white",
        size === "lg" ? "size-12 text-sm" : "size-5 text-[0.5rem]",
      )}
      style={{ backgroundColor: persona.accent }}
    >
      {initials(persona.name)}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <dt className="text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 font-mono text-xl tabular-nums">{value}</dd>
    </div>
  );
}

function ShelfRow({
  entry,
  rank,
  interactive,
  liked,
  onLike,
}: {
  entry: RankedResource;
  rank: number;
  interactive: boolean;
  liked: boolean;
  onLike: () => void;
}) {
  const { resource, stats, reasons } = entry;
  const trending = stats.trend > 0.82;
  return (
    <li className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-start gap-3">
        <span className="w-6 shrink-0 font-mono text-[0.7rem] tabular-nums text-muted-foreground">
          {String(rank).padStart(2, "0")}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[0.9rem] font-medium leading-snug hover:text-brand-ink"
            >
              {resource.title}
            </a>
            {resource.id.startsWith("local-") ? (
              <span className="rounded-full bg-brand/10 px-1.5 py-0.5 text-[0.6rem] font-medium tracking-wide text-brand-ink uppercase">
                New
              </span>
            ) : null}
            {trending ? (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-ember/15 px-1.5 py-0.5 text-[0.6rem] font-medium tracking-wide text-ember-ink uppercase">
                <TrendingUpIcon className="size-2.5" aria-hidden="true" />
                Trending
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-[0.75rem] text-muted-foreground">
            {resource.creator} · {typeLabel(resource.type)} · {resource.length}
          </p>
          {reasons.length > 0 ? (
            <p className="mt-1 flex flex-wrap gap-1">
              {reasons.slice(0, 2).map((reason) => (
                <span
                  key={reason}
                  className="rounded-full border border-border px-1.5 py-0.5 text-[0.65rem] text-muted-foreground"
                >
                  {reason}
                </span>
              ))}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {interactive ? (
            <button
              type="button"
              onClick={onLike}
              aria-pressed={liked}
              aria-label={`${liked ? "Unlike" : "Like"} ${resource.title}`}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[0.7rem] transition-colors",
                liked
                  ? "bg-brand/10 text-brand-ink"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <HeartIcon
                className={cn("size-3", liked && "fill-current")}
                aria-hidden="true"
              />
              {stats.likes}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 px-1.5 py-1 text-[0.7rem] text-muted-foreground">
              <HeartIcon className="size-3" aria-hidden="true" />
              {stats.likes}
            </span>
          )}
          <span className="flex items-center gap-2 text-[0.65rem] text-muted-foreground">
            <span className="inline-flex items-center gap-0.5">
              <EyeIcon className="size-2.5" aria-hidden="true" />
              {stats.views}
            </span>
            <span className="inline-flex items-center gap-0.5">
              <MessageSquareIcon className="size-2.5" aria-hidden="true" />
              {stats.reviews}
            </span>
          </span>
        </div>
      </div>
    </li>
  );
}

function AddResourceForm({ onAdded }: { onAdded: (title: string) => void }) {
  const { addResource, persona } = useLibraryState();
  const [type, setType] = useState<MediaType>("book");
  const [title, setTitle] = useState("");
  const [creator, setCreator] = useState("");
  const [url, setUrl] = useState("");
  const [length, setLength] = useState("");
  const [blurb, setBlurb] = useState("");
  const [tags, setTags] = useState<TagId[]>([]);
  const [error, setError] = useState<string | null>(null);

  function toggleTag(tag: TagId) {
    setTags((current) =>
      current.includes(tag)
        ? current.filter((value) => value !== tag)
        : current.length >= 3
          ? current
          : [...current, tag],
    );
  }

  return (
    <form
      className="mt-3 space-y-3 rounded-lg border border-border bg-muted/30 p-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!title.trim() || !url.trim()) {
          setError("A title and a link are required.");
          return;
        }
        if (!/^https?:\/\//i.test(url.trim())) {
          setError("The link needs to start with http:// or https://");
          return;
        }
        addResource({ title, creator, type, url, length, blurb, tags });
        setTitle("");
        setCreator("");
        setUrl("");
        setLength("");
        setBlurb("");
        setTags([]);
        setError(null);
        onAdded(title.trim());
      }}
    >
      <div className="flex items-center gap-2">
        <FolderIcon className="size-4 text-brand" aria-hidden="true" />
        <p className="text-[0.8125rem] font-medium">
          Add a file to {persona.name.split(" ")[0]}&rsquo;s shelf
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Title">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            placeholder="The book you keep recommending"
            className="h-8 w-full rounded-md border border-input bg-background px-2 text-[0.8125rem]"
          />
        </Field>
        <Field label="Creator">
          <input
            value={creator}
            onChange={(event) => setCreator(event.target.value)}
            placeholder="Author, host or publication"
            className="h-8 w-full rounded-md border border-input bg-background px-2 text-[0.8125rem]"
          />
        </Field>
        <Field label="Type">
          <select
            value={type}
            onChange={(event) => setType(event.target.value as MediaType)}
            className="h-8 w-full rounded-md border border-input bg-background px-2 text-[0.8125rem]"
          >
            {TYPES.map((value) => (
              <option key={value} value={value}>
                {TYPE_NOUN[value]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Length">
          <input
            value={length}
            onChange={(event) => setLength(event.target.value)}
            placeholder="6h read, 30 min listen…"
            className="h-8 w-full rounded-md border border-input bg-background px-2 text-[0.8125rem]"
          />
        </Field>
      </div>

      <Field label="Link">
        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          type="url"
          required
          placeholder="https://…"
          className="h-8 w-full rounded-md border border-input bg-background px-2 text-[0.8125rem]"
        />
      </Field>

      <Field label="Why should someone read it?">
        <textarea
          value={blurb}
          onChange={(event) => setBlurb(event.target.value)}
          rows={2}
          placeholder="One honest sentence."
          className="w-full resize-none rounded-md border border-input bg-background px-2 py-1.5 text-[0.8125rem]"
        />
      </Field>

      <div>
        <p className="text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
          Tags · up to 3
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              aria-pressed={tags.includes(tag)}
              className={cn(
                "rounded-full border px-2 py-0.5 text-[0.7rem] transition-colors",
                tags.includes(tag)
                  ? "border-brand/40 bg-brand/10 text-brand-ink"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {tagLabel(tag)}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.7rem] text-muted-foreground">
          Saved in this browser as {persona.name.split(" ")[0]}.
        </p>
        <Button type="submit" size="sm" className="h-8 gap-1.5 px-3 text-[0.8125rem]">
          <PenLineIcon className="size-3.5" aria-hidden="true" />
          Add to shelf
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <span className="mt-1 block">{children}</span>
    </label>
  );
}
