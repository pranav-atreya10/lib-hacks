"use client";

import { useLibraryState } from "@/components/library-state";
import { PersonaAvatar } from "@/components/persona-avatar";
import { PERSONAS, type Persona } from "@/lib/personas";
import { officeBySlug } from "@/lib/offices";
import { cn } from "@/lib/utils";

/**
 * "Reading as" — one segmented row. Picking a person re-ranks everything and
 * unlocks liking, reviewing, recommending and tagging in their office.
 */
export function PersonaSwitcher() {
  const { personaId, setPersonaId, persona } = useLibraryState();
  const options: (Persona | null)[] = [null, ...PERSONAS];

  return (
    <section aria-labelledby="who-heading" className="grid gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="who-heading" className="text-sm font-medium">
          Reading as
        </h2>
        <p className="text-sm text-muted-foreground">
          {persona
            ? `${persona.traits.join(" · ")} — ${persona.blurb}`
            : "Visitors can look at everything. Pick a person to like, review, recommend and tag."}
        </p>
      </div>
      <div
        role="radiogroup"
        aria-labelledby="who-heading"
        data-tour="personas"
        className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/60 p-1 sm:grid-cols-4"
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
                "press flex items-center gap-2.5 rounded-[6px] px-3 py-2 text-left",
                selected
                  ? "bg-card shadow-[0_0_0_1px_var(--border),0_1px_2px_rgb(0_0_0/0.04)]"
                  : "hover:bg-card/60",
              )}
            >
              <PersonaAvatar persona={option} size="sm" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {option ? option.name.split(" ")[0] : "Visitor"}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {option ? `${office?.city} · ${option.traits[0]}` : "View only"}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
