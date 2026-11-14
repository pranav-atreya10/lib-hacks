"use client";

import { LockIcon, PlusIcon, TagIcon } from "lucide-react";
import { useLibraryState } from "@/components/library-state";
import { PersonaAvatar } from "@/components/persona-avatar";
import { RecommendDialog } from "@/components/recommend-dialog";
import { Button } from "@/components/ui/button";
import { PERSONAS } from "@/lib/personas";

/** What the reader can do on this office's shelf, and who works here. */
export function OfficeActions({ officeSlug, city }: { officeSlug: string; city: string }) {
  const { persona, setPersonaId } = useLibraryState();
  const locals = PERSONAS.filter((person) => person.office === officeSlug);
  const worksHere = !!persona && persona.office === officeSlug;

  if (worksHere) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4">
        <PersonaAvatar persona={persona} size="sm" />
        <p className="mr-auto text-sm">
          <strong className="font-semibold">{persona.name.split(" ")[0]}, you work here.</strong>{" "}
          <span className="text-muted-foreground">
            Recommend to this shelf, and add tags to any file in it.
          </span>
        </p>
        <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:inline-flex">
          <TagIcon className="size-3.5" aria-hidden="true" />
          Open a file to tag it
        </span>
        <RecommendDialog>
          <Button size="sm">
            <PlusIcon className="size-4" aria-hidden="true" />
            Recommend
          </Button>
        </RecommendDialog>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-muted px-5 py-4 text-sm">
      <LockIcon className="size-4 text-muted-foreground" aria-hidden="true" />
      <p className="mr-auto text-muted-foreground">
        {locals.length > 0
          ? `Only people in ${city} can recommend and tag here.`
          : `View only — none of our six people work in ${city}.`}
      </p>
      {locals.map((person) => (
        <Button key={person.id} size="sm" variant="outline" onClick={() => setPersonaId(person.id)}>
          <PersonaAvatar persona={person} size="xs" />
          Read as {person.name.split(" ")[0]}
        </Button>
      ))}
    </div>
  );
}
