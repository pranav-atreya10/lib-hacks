"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckIcon, ImageIcon, LoaderIcon, PlusIcon, SparklesIcon } from "@/components/icons";
import type { MediaType } from "@/lib/catalog";
import { guessType } from "@/lib/covers";
import { TAGS, tagLabel, type TagId } from "@/lib/tags";
import { TYPE_NOUN } from "@/lib/media";
import { addItem } from "@/app/actions";
import { toast } from "sonner";
import { Cover, type CoverStatus } from "@/components/cover";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const TYPES: MediaType[] = ["book", "podcast", "video", "article"];

function useDebounced<T>(value: T, delay: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return settled;
}

/**
 * Recommend something to your own office. Paste a link and the form guesses
 * the kind of file, fills in the title, and shows the cover it found before
 * anything is posted.
 */
export function RecommendDialog({
  children,
  libraryId,
  libraryName,
  onAdded,
}: {
  children: React.ReactNode;
  libraryId: string;
  libraryName: string;
  onAdded?: (title: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <div className="grid gap-1.5 pr-8">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            Recommend to {libraryName}
          </DialogTitle>
          <DialogDescription className="text-[0.9375rem]">
            Everyone in this library will see it. Paste a link first — the cover and title fill
            themselves in.
          </DialogDescription>
        </div>
        <RecommendForm
          libraryId={libraryId}
          onDone={(title) => {
            setOpen(false);
            toast.success(`Added “${title}” to ${libraryName}`);
            onAdded?.(title);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function RecommendForm({
  libraryId,
  onDone,
}: {
  libraryId: string;
  onDone: (title: string) => void;
}) {
  const [url, setUrl] = useState("");
  // null until the person picks a kind or types a title themselves.
  const [chosenType, setChosenType] = useState<MediaType | null>(null);
  const [typedTitle, setTypedTitle] = useState<string | null>(null);
  const [fetched, setFetched] = useState<{
    url: string;
    title: string | null;
    creator: string | null;
    length: string | null;
  } | null>(null);
  // null until the person types their own; until then the link fills them in.
  const [typedCreator, setCreator] = useState<string | null>(null);
  const [typedLength, setLength] = useState<string | null>(null);
  const [blurb, setBlurb] = useState("");
  const [tags, setTags] = useState<TagId[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<CoverStatus>("generated");
  const [saving, setSaving] = useState(false);

  const validUrl = /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(url.trim());
  const previewUrl = useDebounced(validUrl ? url.trim() : "", 450);

  // Guess the kind of file from the link until the person picks one.
  const type: MediaType = chosenType ?? (previewUrl ? guessType(previewUrl) : null) ?? "article";
  // Fill the title from the page, unless the person already typed one.
  const title =
    typedTitle ?? (fetched && fetched.url === previewUrl ? (fetched.title ?? "") : "");
  const fetchingTitle = !!previewUrl && typedTitle === null && fetched?.url !== previewUrl;
  const fromLink = fetched && fetched.url === previewUrl ? fetched : null;
  const creator = typedCreator ?? fromLink?.creator ?? "";
  const length = typedLength ?? fromLink?.length ?? "";

  const previewTitle = useDebounced(title.trim(), 450);
  const previewCreator = useDebounced(creator.trim(), 450);

  useEffect(() => {
    if (!previewUrl) return;
    const controller = new AbortController();
    fetch(`/api/thumbnail?${new URLSearchParams({ url: previewUrl, format: "json" })}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { title?: string | null; creator?: string | null; length?: string | null } | null) => {
        setFetched({
          url: previewUrl,
          title: data?.title ? data.title.slice(0, 140) : null,
          creator: data?.creator ? data.creator.slice(0, 120) : null,
          length: data?.length ? data.length.slice(0, 40) : null,
        });
      })
      .catch(() => {
        if (!controller.signal.aborted) setFetched({ url: previewUrl, title: null, creator: null, length: null });
      });
    return () => controller.abort();
  }, [previewUrl]);

  const onStatus = useCallback((next: CoverStatus) => setStatus(next), []);

  function toggleTag(tag: TagId) {
    setTags((current) =>
      current.includes(tag)
        ? current.filter((value) => value !== tag)
        : current.length >= 3
          ? current
          : [...current, tag],
    );
  }

  const coverLabel = !previewUrl
    ? "Paste a link to find a cover"
    : status === "loading"
      ? "Looking for a cover…"
      : status === "found"
        ? "Cover found from the link"
        : type === "book"
          ? "No cover online — using a printed-style cover"
          : "No image on that page — using a generated cover";

  return (
    <form
      className="grid gap-6 md:grid-cols-[minmax(0,1fr)_260px]"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!validUrl) {
          setError("Add a link that starts with http:// or https://");
          return;
        }
        if (!title.trim()) {
          setError("Give it a title.");
          return;
        }
        setSaving(true);
        const result = await addItem({ libraryId, title, creator, type, url, length, blurb, tags });
        setSaving(false);
        if (result.error) setError(result.error);
        else onDone(title.trim());
      }}
    >
      <div className="grid gap-4">
        <Field label="Link" hint="A book page, video, podcast or article">
          <input
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              setError(null);
            }}
            type="url"
            inputMode="url"
            autoFocus
            placeholder="https://"
            className={inputClass}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" hint={fetchingTitle ? "Reading the page…" : undefined}>
            <input
              value={title}
              onChange={(event) => {
                setTypedTitle(event.target.value);
                setError(null);
              }}
              placeholder="What is it called?"
              className={inputClass}
            />
          </Field>
          <Field label="By">
            <input
              value={creator}
              onChange={(event) => setCreator(event.target.value)}
              placeholder="Author, host or publication"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <fieldset className="grid gap-1.5">
            <legend className="mb-1.5 text-[0.8125rem] font-medium">Kind</legend>
            <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted p-1">
              {TYPES.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={type === value}
                  onClick={() => setChosenType(value)}
                  className={cn(
                    "press rounded-lg py-1.5 text-xs font-medium",
                    type === value
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {TYPE_NOUN[value]}
                </button>
              ))}
            </div>
          </fieldset>
          <Field label="Length">
            <input
              value={length}
              onChange={(event) => setLength(event.target.value)}
              placeholder="6h read, 40 min listen…"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Why should someone open it?">
          <textarea
            value={blurb}
            onChange={(event) => setBlurb(event.target.value)}
            rows={2}
            placeholder="One honest sentence."
            className={cn(inputClass, "h-auto resize-none py-2")}
          />
        </Field>

        <fieldset>
          <legend className="text-[0.8125rem] font-medium">
            Tags <span className="font-normal text-muted-foreground">· up to 3</span>
          </legend>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                aria-pressed={tags.includes(tag)}
                className={cn(
                  "press rounded-full border px-2.5 py-1 text-xs",
                  tags.includes(tag)
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                )}
              >
                {tagLabel(tag)}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="grid content-start gap-3">
        <p className="text-[0.8125rem] font-medium">Cover preview</p>
        <div className="overflow-hidden rounded-xl border border-border">
          {previewUrl ? (
            <Cover
              key={`${previewUrl}|${type}`}
              eager
              item={{
                slug: previewTitle || previewUrl,
                title: previewTitle || "Your recommendation",
                creator: previewCreator,
                type,
                url: previewUrl,
              }}
              onStatus={onStatus}
            />
          ) : (
            <div className="grid aspect-video place-items-center bg-muted text-muted-foreground">
              <ImageIcon className="size-6" aria-hidden="true" />
            </div>
          )}
        </div>
        <p
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
          aria-live="polite"
        >
          {previewUrl && status === "loading" ? (
            <LoaderIcon className="size-3.5 animate-spin" aria-hidden="true" />
          ) : previewUrl && status === "found" ? (
            <CheckIcon className="size-3.5 text-emerald-600" aria-hidden="true" />
          ) : (
            <SparklesIcon className="size-3.5" aria-hidden="true" />
          )}
          {coverLabel}
        </p>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={saving} size="lg" className="mt-2 w-full">
          <PlusIcon className="size-4" aria-hidden="true" />
          {saving ? "Adding…" : "Add to the shelf"}
        </Button>
      </div>
    </form>
  );
}

const inputClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="flex items-baseline justify-between gap-2 text-[0.8125rem] font-medium">
        {label}
        {hint ? <span className="text-xs font-normal text-muted-foreground">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}
