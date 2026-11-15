"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  addCoachingNote,
  addCollection,
  addLibraryMember,
  addReview,
  addTag,
  assignRead,
  createInvite,
  createLibrary,
  deleteItem,
  pickGiveawayWinner,
  recordView,
  removeAssignment,
  removeCollection,
  removeLibraryMember,
  removeTag,
  revokeInvite,
  setGiveawayPrize,
  setLibraryMembership,
  setLibraryRole,
  setMemberRole,
  updateCompany,
  updateProfile,
  type FormState,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CheckIcon, PlusIcon, StarIcon, TrashIcon, XIcon } from "@/components/icons";
import { TEMPLATES } from "@/lib/marketplace";
import { TAGS, tagLabel, type TagId } from "@/lib/tags";
import { cn } from "@/lib/utils";

function useAction() {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<unknown>, success?: string) =>
    start(async () => {
      try {
        const result = (await fn()) as FormState | undefined;
        if (result?.error) toast.error(result.error);
        else if (success) toast.success(success);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Something went wrong.");
      }
    });
  return [pending, run] as const;
}

/* ---------------------------------------------------------------- libraries */

export function JoinLibraryButton({
  libraryId,
  joined,
  isPrivate,
}: {
  libraryId: string;
  joined: boolean;
  isPrivate: boolean;
}) {
  const [pending, run] = useAction();
  if (!joined && isPrivate) {
    return (
      <Button variant="outline" disabled>
        Private — ask an admin
      </Button>
    );
  }
  return (
    <Button
      variant={joined ? "outline" : "default"}
      disabled={pending}
      onClick={() => run(() => setLibraryMembership(libraryId, !joined), joined ? "Left the library" : "Joined")}
    >
      {joined ? "Leave" : "Join library"}
    </Button>
  );
}

export function CreateLibraryButton({ templateKey, label = "New library" }: { templateKey?: string; label?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createLibrary, {});
  const template = TEMPLATES.find((entry) => entry.key === templateKey);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={templateKey ? "outline" : "default"} size={templateKey ? "sm" : "default"}>
          <PlusIcon className="size-4" aria-hidden="true" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="text-xl font-semibold tracking-tight">New library</DialogTitle>
        <DialogDescription>
          A shelf for a team, a practice, an office or a reading group. You&rsquo;ll be its admin.
        </DialogDescription>
        <form action={action} className="grid gap-4">
          <Field label="Name">
            <input name="name" required defaultValue={template?.name ?? ""} placeholder="e.g. India delivery team" className={inputClass} />
          </Field>
          <Field label="Description" hint="Optional">
            <input name="description" defaultValue={template?.description ?? ""} className={inputClass} />
          </Field>
          <Field label="Start from">
            <select name="template" defaultValue={templateKey ?? ""} className={inputClass}>
              <option value="">An empty shelf</option>
              {TEMPLATES.map((entry) => (
                <option key={entry.key} value={entry.key}>
                  {entry.name}
                </option>
              ))}
            </select>
          </Field>
          <fieldset className="grid gap-2">
            <legend className="mb-1 text-[0.8125rem] font-medium">Who can join</legend>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="visibility" value="open" defaultChecked /> Anyone in the company
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="visibility" value="private" /> Only people an admin adds
            </label>
          </fieldset>
          {state.error ? (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create library"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CollectionToggle({
  libraryId,
  collectionKey,
  added,
  name,
}: {
  libraryId: string;
  collectionKey: string;
  added: boolean;
  name: string;
}) {
  const [pending, run] = useAction();
  return (
    <Button
      size="sm"
      variant={added ? "outline" : "default"}
      disabled={pending}
      onClick={() =>
        run(
          () => (added ? removeCollection(libraryId, collectionKey) : addCollection(libraryId, collectionKey)),
          added ? `Removed ${name}` : `Added ${name}`,
        )
      }
    >
      {added ? (
        <>
          <CheckIcon className="size-3.5" aria-hidden="true" /> Added
        </>
      ) : (
        <>
          <PlusIcon className="size-3.5" aria-hidden="true" /> Add
        </>
      )}
    </Button>
  );
}

/** Marketplace: add a collection to one of the libraries you run. */
export function AddToLibrary({
  collectionKey,
  name,
  libraries,
}: {
  collectionKey: string;
  name: string;
  libraries: { id: string; name: string; added: boolean }[];
}) {
  const [libraryId, setLibraryId] = useState(libraries.find((library) => !library.added)?.id ?? libraries[0]?.id ?? "");
  const [pending, run] = useAction();
  if (libraries.length === 0) {
    return <p className="text-xs text-muted-foreground">Create or lead a library to add this.</p>;
  }
  const chosen = libraries.find((library) => library.id === libraryId);
  return (
    <div className="flex gap-2">
      <label className="sr-only" htmlFor={`add-${collectionKey}`}>
        Library
      </label>
      <select
        id={`add-${collectionKey}`}
        value={libraryId}
        onChange={(event) => setLibraryId(event.target.value)}
        className={cn(inputClass, "h-8 min-w-0 flex-1 text-xs")}
      >
        {libraries.map((library) => (
          <option key={library.id} value={library.id}>
            {library.name}
            {library.added ? " (added)" : ""}
          </option>
        ))}
      </select>
      <Button
        size="sm"
        disabled={pending || !chosen || chosen.added}
        onClick={() => run(() => addCollection(libraryId, collectionKey), `Added ${name} to ${chosen?.name}`)}
      >
        {chosen?.added ? "Added" : "Add"}
      </Button>
    </div>
  );
}

export function AddMember({
  libraryId,
  people,
}: {
  libraryId: string;
  people: { id: string; name: string }[];
}) {
  const [userId, setUserId] = useState("");
  const [pending, run] = useAction();
  if (people.length === 0) return null;
  return (
    <div className="flex gap-2">
      <label className="sr-only" htmlFor={`member-${libraryId}`}>
        Add someone
      </label>
      <select
        id={`member-${libraryId}`}
        value={userId}
        onChange={(event) => setUserId(event.target.value)}
        className={cn(inputClass, "h-8 min-w-0 flex-1 text-xs")}
      >
        <option value="">Add someone…</option>
        {people.map((person) => (
          <option key={person.id} value={person.id}>
            {person.name}
          </option>
        ))}
      </select>
      <Button
        size="sm"
        disabled={!userId || pending}
        onClick={() => run(() => addLibraryMember(libraryId, userId).then(() => setUserId("")), "Added")}
      >
        Add
      </Button>
    </div>
  );
}

export function MemberRoleControls({
  libraryId,
  userId,
  role,
  isSelf,
}: {
  libraryId: string;
  userId: string;
  role: "admin" | "member";
  isSelf: boolean;
}) {
  const [pending, run] = useAction();
  return (
    <span className="flex items-center gap-1">
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() => run(() => setLibraryRole(libraryId, userId, role === "admin" ? "member" : "admin"))}
      >
        {role === "admin" ? "Make member" : "Make admin"}
      </Button>
      {isSelf ? null : (
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          aria-label="Remove from library"
          onClick={() => run(() => removeLibraryMember(libraryId, userId), "Removed")}
        >
          <XIcon className="size-3.5" aria-hidden="true" />
        </Button>
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ coaching */

export function CoachingNoteForm({ libraryId, memberId, firstName }: { libraryId: string; memberId: string; firstName: string }) {
  const [body, setBody] = useState("");
  const [pending, run] = useAction();
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        run(async () => {
          const result = await addCoachingNote(libraryId, memberId, body);
          if (!result.error) setBody("");
          return result;
        }, "Note saved");
      }}
      className="grid gap-2"
    >
      <label className="sr-only" htmlFor={`note-${memberId}`}>
        Coaching note
      </label>
      <textarea
        id={`note-${memberId}`}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={3}
        placeholder={`A note for ${firstName} — they'll see it on their profile.`}
        className={cn(inputClass, "h-auto py-2")}
      />
      <Button type="submit" size="sm" disabled={pending || !body.trim()} className="justify-self-end">
        Save note
      </Button>
    </form>
  );
}

export function AssignReadForm({
  libraryId,
  memberId,
  options,
}: {
  libraryId: string;
  memberId: string;
  options: { key: string; title: string; hint: string }[];
}) {
  const [itemKey, setItemKey] = useState(options[0]?.key ?? "");
  const [note, setNote] = useState("");
  const [pending, run] = useAction();
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        run(async () => {
          const result = await assignRead(libraryId, memberId, itemKey, note);
          if (!result.error) setNote("");
          return result;
        }, "Assigned");
      }}
      className="grid gap-2"
    >
      <label className="sr-only" htmlFor={`assign-${memberId}`}>
        File to assign
      </label>
      <select id={`assign-${memberId}`} value={itemKey} onChange={(event) => setItemKey(event.target.value)} className={inputClass}>
        {options.map((option) => (
          <option key={option.key} value={option.key}>
            {option.title} — {option.hint}
          </option>
        ))}
      </select>
      <input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Why this one? (optional)"
        aria-label="Note with the assignment"
        className={inputClass}
      />
      <Button type="submit" size="sm" disabled={pending || !itemKey} className="justify-self-end">
        Assign read
      </Button>
    </form>
  );
}

export function RemoveAssignmentButton({ libraryId, id }: { libraryId: string; id: string }) {
  const [pending, run] = useAction();
  return (
    <Button size="sm" variant="ghost" disabled={pending} aria-label="Remove assignment" onClick={() => run(() => removeAssignment(libraryId, id))}>
      <XIcon className="size-3.5" aria-hidden="true" />
    </Button>
  );
}

/* ------------------------------------------------------------------ giveaway */

export function GiveawayControls({
  libraryId,
  prize,
  winnerId,
  candidates,
}: {
  libraryId: string;
  prize: string;
  winnerId: string | null;
  candidates: { id: string; name: string; score: number }[];
}) {
  const [draft, setDraft] = useState(prize);
  const [winner, setWinner] = useState(winnerId ?? "");
  const [pending, run] = useAction();
  return (
    <div className="grid gap-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          run(() => setGiveawayPrize(libraryId, draft), "Prize saved");
        }}
        className="flex gap-2"
      >
        <label className="sr-only" htmlFor={`prize-${libraryId}`}>
          Prize
        </label>
        <input
          id={`prize-${libraryId}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="e.g. A $50 book voucher"
          className={inputClass}
        />
        <Button type="submit" variant="outline" disabled={pending}>
          Save
        </Button>
      </form>
      <div className="flex gap-2">
        <label className="sr-only" htmlFor={`winner-${libraryId}`}>
          Winner
        </label>
        <select id={`winner-${libraryId}`} value={winner} onChange={(event) => setWinner(event.target.value)} className={inputClass}>
          <option value="">No winner yet</option>
          {candidates.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name} — {person.score} pts
            </option>
          ))}
        </select>
        <Button disabled={pending} onClick={() => run(() => pickGiveawayWinner(libraryId, winner || null), winner ? "Winner picked" : "Cleared")}>
          Pick winner
        </Button>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- items */

/** Logs a view once per visit, after the page shows. */
export function RecordView({ itemKey }: { itemKey: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void recordView(itemKey);
  }, [itemKey]);
  return null;
}

export function ReviewForm({ itemKey, name }: { itemKey: string; name: string }) {
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [pending, run] = useAction();
  return (
    <form
      className="grid gap-2.5 rounded-xl border border-border p-3"
      onSubmit={(event) => {
        event.preventDefault();
        run(async () => {
          const result = await addReview(itemKey, rating, body);
          if (!result.error) {
            setBody("");
            setRating(5);
          }
          return result;
        }, "Review posted");
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">Posting as {name}</span>
        <span role="radiogroup" aria-label="Rating" className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={rating === star}
              aria-label={`${star} star${star === 1 ? "" : "s"}`}
              onClick={() => setRating(star)}
              className="press grid size-7 place-items-center rounded-md hover:bg-muted"
            >
              <StarIcon className={cn("size-4", star <= rating ? "fill-ember text-ember" : "text-border")} aria-hidden="true" />
            </button>
          ))}
        </span>
      </div>
      <label className="sr-only" htmlFor={`review-${itemKey}`}>
        Your review
      </label>
      <textarea
        id={`review-${itemKey}`}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={2}
        placeholder="What stuck with you?"
        className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
      />
      <Button type="submit" size="sm" disabled={pending || !body.trim()} className="justify-self-end">
        Post review
      </Button>
    </form>
  );
}

export function TagEditor({
  itemKey,
  tags,
  removable,
}: {
  itemKey: string;
  tags: TagId[];
  removable: TagId[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, run] = useAction();
  return (
    <div className="grid gap-3">
      <ul className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <li key={tag} className={cn("tag", removable.includes(tag) && "bg-tint-blue text-tint-blue-ink")}>
            {tagLabel(tag)}
            {removable.includes(tag) ? (
              <button type="button" aria-label={`Remove tag ${tagLabel(tag)}`} disabled={pending} onClick={() => run(() => removeTag(itemKey, tag))}>
                <XIcon className="size-3" aria-hidden="true" />
              </button>
            ) : null}
          </li>
        ))}
        <li>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="press inline-flex items-center gap-1 rounded-full border border-dashed border-foreground/30 px-2.5 py-0.5 text-xs hover:border-foreground/60"
          >
            <PlusIcon className="size-3" aria-hidden="true" />
            Add tag
          </button>
        </li>
      </ul>
      {open ? (
        <div className="flex flex-wrap gap-1.5 rounded-lg bg-muted p-3">
          {TAGS.filter((tag) => !tags.includes(tag)).map((tag) => (
            <button
              key={tag}
              type="button"
              disabled={pending}
              onClick={() => run(() => addTag(itemKey, tag))}
              className="press rounded-full border border-border bg-card px-2.5 py-1 text-xs hover:border-foreground/40"
            >
              {tagLabel(tag)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function DeleteItemButton({ itemKey, title, back }: { itemKey: string; title: string; back: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, run] = useAction();
  const router = useRouter();
  return (
    <section className={cn("grid gap-3 rounded-lg border p-4", confirming ? "border-tint-red-ink/30 bg-tint-red" : "border-border")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{confirming ? "Delete this file?" : "Remove from the library"}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {confirming ? "It goes for everyone, with its likes, reviews and tags." : "You added this, or you run its library."}
          </p>
        </div>
        {confirming ? (
          <span className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-tint-red-ink text-white hover:bg-tint-red-ink/90"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  const result = await deleteItem(itemKey);
                  if (!result.error) {
                    toast.success(`Deleted “${title}”`);
                    router.push(back);
                  }
                  return result;
                })
              }
            >
              <TrashIcon className="size-3.5" aria-hidden="true" />
              Delete
            </Button>
          </span>
        ) : (
          <Button size="sm" variant="outline" className="text-tint-red-ink" onClick={() => setConfirming(true)}>
            <TrashIcon className="size-3.5" aria-hidden="true" />
            Delete
          </Button>
        )}
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------- admin */

export function InviteManager({
  invites,
  origin,
}: {
  invites: { code: string; role: string; createdAt: string }[];
  origin: string;
}) {
  const [pending, run] = useAction();
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={pending} onClick={() => run(() => createInvite("member"), "Invite link created")}>
          <PlusIcon className="size-3.5" aria-hidden="true" /> Member invite link
        </Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => createInvite("admin"), "Admin invite link created")}>
          <PlusIcon className="size-3.5" aria-hidden="true" /> Admin invite link
        </Button>
      </div>
      {invites.length ? (
        <ul className="grid divide-y divide-border rounded-lg border border-border">
          {invites.map((invite) => {
            const link = `${origin}/join/${invite.code}`;
            return (
              <li key={invite.code} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <span className="tag">{invite.role}</span>
                <code className="min-w-0 flex-1 truncate font-mono text-xs">{link}</code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void navigator.clipboard?.writeText(link);
                    toast.success("Link copied");
                  }}
                >
                  Copy
                </Button>
                <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => revokeInvite(invite.code), "Link revoked")}>
                  Revoke
                </Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No active invite links.</p>
      )}
    </div>
  );
}

export function CompanyRoleSelect({ userId, role }: { userId: string; role: "admin" | "member" }) {
  const [pending, run] = useAction();
  return (
    <select
      aria-label="Company role"
      value={role}
      disabled={pending}
      onChange={(event) => run(() => setMemberRole(userId, event.target.value as "admin" | "member"), "Role updated")}
      className={cn(inputClass, "h-8 w-28 text-xs")}
    >
      <option value="member">Member</option>
      <option value="admin">Admin</option>
    </select>
  );
}

export function CompanySettingsForm({ name, domain, emailDomain }: { name: string; domain: string; emailDomain: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateCompany, {});
  return (
    <form action={action} className="grid gap-4">
      <Field label="Company name">
        <input name="name" defaultValue={name} required className={inputClass} />
      </Field>
      <Field label="Join by email domain" hint={`Your domain: @${emailDomain}`}>
        <input name="domain" defaultValue={domain} placeholder={emailDomain} className={inputClass} />
      </Field>
      <p className="-mt-2 text-xs text-muted-foreground">
        Anyone who signs up with this domain joins automatically. Leave empty to require invites.
      </p>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : state.ok ? (
        <p role="status" className="text-sm text-tint-green-ink">
          {state.ok}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="justify-self-start">
        Save
      </Button>
    </form>
  );
}

export function ProfileForm({ title, interests }: { title: string; interests: TagId[] }) {
  const [picked, setPicked] = useState<TagId[]>(interests);
  const [pending, start] = useTransition();
  return (
    <form
      action={(form) =>
        start(async () => {
          await updateProfile(form);
          toast.success("Profile saved");
        })
      }
      className="grid gap-4"
    >
      <Field label="Your role">
        <input name="title" defaultValue={title} className={inputClass} />
      </Field>
      <fieldset>
        <legend className="mb-2 text-[0.8125rem] font-medium">Interests</legend>
        <div className="flex flex-wrap gap-1.5">
          {TAGS.map((tag) => {
            const on = picked.includes(tag);
            return (
              <label
                key={tag}
                className={cn(
                  "press cursor-pointer rounded-full border px-3 py-1 text-xs",
                  on ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/40",
                )}
              >
                <input
                  type="checkbox"
                  name="interest"
                  value={tag}
                  checked={on}
                  onChange={() => setPicked(on ? picked.filter((value) => value !== tag) : [...picked, tag])}
                  className="sr-only"
                />
                {tagLabel(tag)}
              </label>
            );
          })}
        </div>
      </fieldset>
      <Button type="submit" disabled={pending} className="justify-self-start">
        Save profile
      </Button>
    </form>
  );
}
