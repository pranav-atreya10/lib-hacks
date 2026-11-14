"use client";

import { useSyncExternalStore } from "react";
import { useLibraryState } from "@/components/library-state";
import { RecommendDialog } from "@/components/recommend-dialog";
import { PersonaAvatar } from "@/components/persona-avatar";
import { CompassIcon, PlusIcon, UsersIcon } from "@/components/icons";
import { getPersona } from "@/lib/personas";
import { officeBySlug } from "@/lib/offices";

const KEY = "infinite-library:get-started-dismissed";
const EVENT = "infinite-library:get-started";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

function readDismissed() {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** Three ways in for a first-time visitor (or a judge), dismissable. */
export function GetStarted() {
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => true);
  const { persona, setPersonaId } = useLibraryState();
  if (dismissed) return null;

  const maya = getPersona("maya-chen");
  const jonah = getPersona("jonah-reed");
  const homeCity = persona ? officeBySlug.get(persona.office)?.city : null;

  function dismiss() {
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {}
    window.dispatchEvent(new Event(EVENT));
  }

  return (
    <section aria-labelledby="get-started-heading" className="grid gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="get-started-heading" className="text-[0.9375rem] font-semibold">
          Get started
        </h2>
        <button
          type="button"
          onClick={dismiss}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Dismiss
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <StartCard
          icon={<CompassIcon className="size-4" aria-hidden="true" />}
          title="Take the tour"
          body="Four steps: who's reading, the ranking, office folders, and likes and reviews."
          onClick={() => window.dispatchEvent(new Event("infinite-library:start-tour"))}
        />
        <StartCard
          icon={<UsersIcon className="size-4" aria-hidden="true" />}
          title={persona?.id === "maya-chen" ? "Read as Jonah" : "Read as Maya"}
          body={
            persona?.id === "maya-chen"
              ? "Same library, ranked for an introverted writer in Atlanta."
              : "Same library, ranked for a finance-and-crypto extrovert in New York."
          }
          onClick={() => setPersonaId(persona?.id === "maya-chen" ? "jonah-reed" : "maya-chen")}
          after={<PersonaAvatar persona={persona?.id === "maya-chen" ? (jonah ?? null) : (maya ?? null)} size="xs" />}
        />
        {persona ? (
          <RecommendDialog>
            <StartCard
              icon={<PlusIcon className="size-4" aria-hidden="true" />}
              title={`Recommend to ${homeCity}`}
              body="Paste a link. The cover and title fill themselves in."
            />
          </RecommendDialog>
        ) : (
          <StartCard
            icon={<PlusIcon className="size-4" aria-hidden="true" />}
            title="Recommend something"
            body="Visitors are view only. Read as Jonah to add a file to the Atlanta shelf."
            onClick={() => setPersonaId("jonah-reed")}
          />
        )}
      </div>
    </section>
  );
}

function StartCard({
  icon,
  title,
  body,
  after,
  ...props
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  after?: React.ReactNode;
} & React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      {...props}
      className="press lift grid content-start gap-2 rounded-xl border border-border bg-card p-5 text-left"
    >
      <span className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {title}
        <span className="ml-auto">{after}</span>
      </span>
      <span className="text-sm leading-relaxed text-muted-foreground">{body}</span>
    </button>
  );
}
