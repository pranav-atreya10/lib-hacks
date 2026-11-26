"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cancelJoinRequest, createCompany, finishOnboarding, joinCompany, onboardingInvite, type FormState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/field";
import { Cover } from "@/components/cover";
import { CheckIcon, EyeIcon, HeartIcon, LoaderIcon } from "@/components/icons";
import { CATALOG } from "@/lib/catalog";
import { COLLECTIONS } from "@/lib/marketplace";
import { TAGS, tagLabel, type TagId } from "@/lib/tags";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------- step 1: a company */

export function CompanyStep({ email }: { email: string }) {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [createState, createAction, creating] = useActionState<FormState, FormData>(createCompany, {});
  const [joinState, joinAction, joining] = useActionState<FormState, FormData>(joinCompany, {});
  const domain = email.split("@")[1] ?? "";

  return (
    <div className="grid gap-6">
      <div role="tablist" className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/60 p-1">
        {(["create", "join"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => setMode(value)}
            className={cn(
              "rounded-[6px] py-2 text-sm font-medium",
              mode === value ? "bg-card shadow-[0_0_0_1px_var(--border)]" : "text-muted-foreground",
            )}
          >
            {value === "create" ? "Create a workspace" : "Join with an invite"}
          </button>
        ))}
      </div>

      {mode === "create" ? (
        <form action={createAction} className="grid gap-4">
          <Field label="Company name">
            <input name="company" required autoFocus placeholder="Northwind Partners" className={inputClass} />
          </Field>
          <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
            <input type="checkbox" name="claimDomain" defaultChecked className="mt-0.5 size-4 accent-[var(--primary)]" />
            <span>
              <span className="font-medium">Let anyone with an @{domain} email ask to join</span>
              <span className="mt-0.5 block text-muted-foreground">
                Colleagues who sign up with a work email appear as requests. You approve each one.
              </span>
            </span>
          </label>
          {createState.error ? (
            <p role="alert" className="text-sm text-destructive">
              {createState.error}
            </p>
          ) : null}
          <Button type="submit" size="lg" disabled={creating}>
            {creating ? "Creating…" : "Create workspace"}
          </Button>
          <p className="text-xs text-muted-foreground">You&rsquo;ll be its admin. You can invite people afterwards.</p>
        </form>
      ) : (
        <form action={joinAction} className="grid gap-4">
          <Field label="Invite link or code">
            <input name="code" required autoFocus placeholder="https://…/join/…" className={inputClass} />
          </Field>
          {joinState.error ? (
            <p role="alert" className="text-sm text-destructive">
              {joinState.error}
            </p>
          ) : null}
          <Button type="submit" size="lg" disabled={joining}>
            {joining ? "Joining…" : "Join workspace"}
          </Button>
        </form>
      )}
    </div>
  );
}

/** Signed up with a company's domain: waiting for one of its admins. */
export function PendingRequest({ companyName, email }: { companyName: string; email: string }) {
  const router = useRouter();
  return (
    <div className="grid gap-6">
      <div>
        <span className="grid size-10 place-items-center rounded-full bg-tint-yellow text-tint-yellow-ink">
          <LoaderIcon className="size-5" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">Waiting for {companyName}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {email} matches {companyName}&rsquo;s domain, so we asked its admins to let you in. You&rsquo;ll be
          able to continue as soon as one of them approves.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => router.refresh()}>Check again</Button>
        <form action={cancelJoinRequest}>
          <Button type="submit" variant="outline">
            Cancel request
          </Button>
        </form>
      </div>
      <p className="text-xs text-muted-foreground">
        Have an invite link? Cancel the request, then join with it — invites work straight away.
      </p>
    </div>
  );
}

export function JoinCompanyForm({ code }: { code: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<FormState, FormData>(async (previous, form) => {
    const result = await joinCompany(previous, form);
    if (result.ok) router.push("/onboarding");
    return result;
  }, {});
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="code" value={code} />
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Joining…" : "Join workspace"}
      </Button>
    </form>
  );
}

/* --------------------------------------------- step 2: about you, and likes */

export function ProfileStep({ isCreator, companyName }: { isCreator: boolean; companyName: string }) {
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [interests, setInterests] = useState<TagId[]>([]);
  const [liked, setLiked] = useState<string[]>([]);
  const [collections, setCollections] = useState<string[] | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const picks = useMemo(() => {
    const matching = CATALOG.filter((item) => item.tags.some((tag) => interests.includes(tag)));
    const others = CATALOG.filter((item) => !matching.includes(item));
    return [...matching.slice(0, 9), ...others.filter((_, index) => index % 9 === 0).slice(0, 3)];
  }, [interests]);

  // The creator's suggested collections follow their interests until they choose.
  const suggested = COLLECTIONS.filter((collection) => collection.tags.some((tag) => interests.includes(tag))).map(
    (collection) => collection.key,
  );
  const chosenCollections = collections ?? (suggested.length ? suggested : ["leadership", "communication"]);

  const steps = isCreator ? ["About you", "Likes", "Company library", "Invite your team"] : ["About you", "Likes"];
  const last = step === steps.length - 1;

  function toggle<T>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
  }

  return (
    <form
      action={async (form) => {
        setSubmitting(true);
        await finishOnboarding(form);
      }}
      className="grid gap-8"
    >
      <div className="grid gap-2">
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-medium">{steps[step]}</span>
          <span className="text-muted-foreground tabular-nums">
            Step {step + 1} of {steps.length}
          </span>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={step + 1}
          aria-label="Setup progress"
        >
          <div
            className="h-full rounded-full bg-foreground transition-[width] duration-300 ease-(--ease-out)"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Values ride along as hidden inputs, whichever step is showing. */}
      <input type="hidden" name="title" value={title} />
      {interests.map((tag) => (
        <input key={tag} type="hidden" name="interest" value={tag} />
      ))}
      {liked.map((key) => (
        <input key={key} type="hidden" name="like" value={key} />
      ))}
      {isCreator
        ? chosenCollections.map((key) => <input key={key} type="hidden" name="collection" value={key} />)
        : null}

      {step === 0 ? (
        <section key={step} className="rise-in grid gap-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">What are you into?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick at least three. Your library ranks itself around them, and you can change them any time.
            </p>
          </div>
          <Field label="Your role" hint="Optional">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Product designer"
              className={inputClass}
            />
          </Field>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Interests">
            {TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                aria-pressed={interests.includes(tag)}
                onClick={() => setInterests((current) => toggle(current, tag))}
                className={cn(
                  "press rounded-full border px-3.5 py-1.5 text-sm",
                  interests.includes(tag)
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card hover:border-foreground/40",
                )}
              >
                {tagLabel(tag)}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {step === 1 ? (
        <section key={step} className="rise-in grid gap-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Like a few things you&rsquo;d open</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap the ones that look good. Most match your interests; a few are outside them on purpose.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {picks.map((item) => {
              const key = `c-${item.slug}`;
              const on = liked.includes(key);
              return (
                <li key={key}>
                  <button
                    type="button"
                    aria-pressed={on}
                    aria-label={`${on ? "Unlike" : "Like"} ${item.title}`}
                    onClick={() => setLiked((current) => toggle(current, key))}
                    className={cn(
                      "press group relative w-full overflow-hidden rounded-lg border text-left",
                      on ? "border-foreground ring-1 ring-foreground" : "border-border",
                    )}
                  >
                    <Cover item={item} />
                    <span
                      className={cn(
                        "absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-card/95",
                        on ? "text-rose-600" : "text-muted-foreground",
                      )}
                    >
                      <HeartIcon className={cn("size-4", on && "fill-current")} />
                    </span>
                    <span className="block truncate px-2.5 py-2 text-xs font-medium">{item.title}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {isCreator && step === 2 ? (
        <section key={step} className="rise-in grid gap-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Stock the company library</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              &ldquo;Everyone at {companyName}&rdquo; is open to the whole company. Add collections from the
              marketplace to start it off — anyone can create more libraries later.
            </p>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {COLLECTIONS.map((collection) => {
              const on = chosenCollections.includes(collection.key);
              return (
                <li key={collection.key}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => setCollections(toggle(chosenCollections, collection.key))}
                    className={cn(
                      "press flex w-full items-start gap-3 rounded-lg border p-3 text-left",
                      on ? "border-foreground" : "border-border hover:border-foreground/40",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid size-5 shrink-0 place-items-center rounded border",
                        on ? "border-foreground bg-foreground text-background" : "border-border",
                      )}
                    >
                      {on ? <CheckIcon className="size-3" /> : null}
                    </span>
                    <span>
                      <span className="block text-sm font-medium">{collection.name}</span>
                      <span className="block text-xs text-muted-foreground">{collection.description}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {isCreator && step === 3 ? <InviteStep key={step} companyName={companyName} /> : null}

      {last ? (
        <p className="flex items-start gap-2 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
          <EyeIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          What you open, like and review is visible to admins of the libraries you join, so they can
          recommend and coach. You can see exactly what they see on your profile.
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        {step > 0 ? (
          <Button type="button" variant="ghost" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        ) : (
          <span />
        )}
        {last ? (
          <Button key="finish" type="submit" size="lg" disabled={submitting || interests.length < 3}>
            {submitting ? "Setting up…" : "Open my library"}
          </Button>
        ) : (
          <Button
            key={`next-${step}`}
            type="button"
            size="lg"
            disabled={step === 0 && interests.length < 3}
            onClick={() => setStep(step + 1)}
          >
            {step === 0 && interests.length < 3 ? `Pick ${3 - interests.length} more` : "Continue"}
          </Button>
        )}
      </div>
    </form>
  );
}

/** Admins: share the way in before entering the app. */
function InviteStep({ companyName }: { companyName: string }) {
  const [invite, setInvite] = useState<{ code: string | null; domain: string | null } | null>(null);
  useEffect(() => {
    let live = true;
    void onboardingInvite().then((result) => {
      if (live) setInvite(result);
    });
    return () => {
      live = false;
    };
  }, []);
  const link = invite?.code ? `${window.location.origin}/join/${invite.code}` : "";
  return (
    <section className="rise-in grid gap-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Invite your team</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A library is better with people in it. Share this link — anyone who opens it joins {companyName} straight away.
        </p>
      </div>
      <div className="flex gap-2">
        <label className="sr-only" htmlFor="invite-link">
          Invite link
        </label>
        <input id="invite-link" readOnly value={link || "Making your link…"} className={cn(inputClass, "font-mono text-xs")} />
        <Button
          type="button"
          variant="outline"
          disabled={!link}
          onClick={() => {
            void navigator.clipboard?.writeText(link);
            toast.success("Invite link copied");
          }}
        >
          Copy
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        {invite?.domain
          ? `People who sign up with an @${invite.domain} email can also ask to join — you'll approve them in Company admin.`
          : "You can make more links, or let your email domain request to join, in Company admin."}
      </p>
    </section>
  );
}
