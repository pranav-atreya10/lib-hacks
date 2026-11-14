"use client";

import { CheckIcon } from "lucide-react";
import { useLibraryState } from "@/components/library-state";
import { PersonaAvatar } from "@/components/persona-avatar";
import { PERSONAS, type Persona } from "@/lib/personas";
import { officeBySlug } from "@/lib/offices";
import { cn } from "@/lib/utils";

/**
 * "Who's reading?" — the big version of the header picker. Picking a person
 * re-ranks everything and unlocks liking, reviewing, recommending and tagging
 * in their office. Visitor is view only.
 */
export function PersonaSwitcher() {
  const { personaId, setPersonaId } = useLibraryState();
  const options: (Persona | null)[] = [null, ...PERSONAS];

  return (
    <section aria-labelledby="who-heading" data-tour="personas">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="who-heading" className="text-lg font-semibold">
          Who&rsquo;s reading?
        </h2>
        <p className="text-sm text-muted-foreground">
          {personaId
            ? "Your ranking, your office, your likes. Switch any time."
            : "You're a visitor: everything is view only. Pick a person to join in."}
        </p>
      </div>

      <div
        role="radiogroup"
        aria-labelledby="who-heading"
        className="-mx-5 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-7 lg:overflow-visible lg:px-0 lg:pb-0"
      >
        {options.map((option) => {
          const id = option?.id ?? null;
          const selected = personaId === id;
          const office = option ? officeBySlug.get(option.office) : null;
          return (
            <button
              key={id ?? "visitor"}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setPersonaId(id)}
              className={cn(
                "press relative flex w-40 shrink-0 snap-start flex-col items-start gap-3 rounded-2xl border p-4 text-left lg:w-auto",
                selected
                  ? "border-foreground/80 bg-card shadow-[var(--shadow-lift)]"
                  : "border-border bg-card/60 hover:border-foreground/25 hover:bg-card",
              )}
            >
              <PersonaAvatar persona={option} size="md" />
              <span className="min-w-0">
                <span className="block truncate text-[0.9375rem] font-semibold">
                  {option ? option.name.split(" ")[0] : "Visitor"}
                </span>
                <span className="mt-0.5 block truncate text-[0.8125rem] text-muted-foreground">
                  {option ? office?.city : "View only"}
                </span>
              </span>
              <span className="line-clamp-1 text-xs text-muted-foreground">
                {option ? option.traits.join(" · ") : "Look around freely"}
              </span>
              {selected ? (
                <span className="absolute top-3 right-3 grid size-5 place-items-center rounded-full bg-foreground text-background">
                  <CheckIcon className="size-3" aria-hidden="true" />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
