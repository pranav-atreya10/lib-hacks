"use client";

import { LockIcon, PlusIcon, TagIcon } from "@/components/icons";
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
      <div className="grid gap-3">
        <div className="flex items-center gap-2.5">
          <PersonaAvatar persona={persona} size="sm" />
          <p className="text-sm font-medium">{persona.name.split(" ")[0]}, you work here.</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Recommend to this shelf, and add tags to any file in it.
        </p>
        <RecommendDialog>
          <Button className="w-full">
            <PlusIcon className="size-4" aria-hidden="true" />
            Recommend to {city}
          </Button>
        </RecommendDialog>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <TagIcon className="size-3.5" aria-hidden="true" />
          Open any file to tag it
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {persona ? (
        <RecommendDialog targetOffice={officeSlug}>
          <Button variant="outline" className="w-full text-muted-foreground">
            <LockIcon className="size-4" aria-hidden="true" />
            Recommend to {city}
          </Button>
        </RecommendDialog>
      ) : null}
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <LockIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {locals.length > 0
          ? `Only people in ${city} can recommend and tag here.`
          : `View only — none of our people work in ${city}.`}
      </p>
      {locals.map((person) => (
        <Button
          key={person.id}
          variant="outline"
          className="w-full justify-start"
          onClick={() => setPersonaId(person.id)}
        >
          <PersonaAvatar persona={person} size="xs" />
          Read as {person.name.split(" ")[0]}
        </Button>
      ))}
    </div>
  );
}
