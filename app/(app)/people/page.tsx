import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRightIcon, SparklesIcon } from "@/components/icons";
import { PERSONAS } from "@/lib/personas";
import { PersonaAvatar } from "@/components/persona-avatar";
import { officeBySlug } from "@/lib/offices";
import { RESOURCES } from "@/lib/content";
import { emptyEngagement, rankResources } from "@/lib/personalize";
import { tagLabel } from "@/lib/tags";
import { typeLabel } from "@/lib/media";

export const metadata: Metadata = {
  title: "People",
  description:
    "Three readers, three shelves. See how the same library ranks for different people — and borrow a shelf that isn't yours.",
};

export default function PeoplePage() {
  return (
    <div className="app-page grid gap-10">
      <header className="max-w-2xl">
        <h1 className="font-display text-[2.25rem] leading-tight">
          Three people, three shelves
        </h1>
        <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted-foreground">
          The same {RESOURCES.length} files rank differently for each of them. Open a shelf to see
          what rises to the top — then add something of your own.
        </p>
      </header>

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PERSONAS.map((persona) => {
          const office = officeBySlug.get(persona.office);
          const top = rankResources(RESOURCES, persona, emptyEngagement).slice(0, 2);

          return (
            <li key={persona.id}>
              <article className="lift relative flex h-full flex-col gap-5 rounded-xl border border-border bg-card p-6">
                <div className="flex items-start gap-3">
                  <PersonaAvatar persona={persona} size="md" />
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold">
                      {persona.name}{" "}
                      <span className="font-normal text-muted-foreground">
                        · {persona.age}
                      </span>
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {persona.role} · {office?.city}
                    </p>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  {persona.blurb}
                </p>

                <div className="flex flex-wrap gap-1">
                  {persona.traits.map((trait) => (
                    <span
                      key={trait}
                      className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground"
                    >
                      {trait}
                    </span>
                  ))}
                  {persona.interests.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs text-brand-ink"
                    >
                      {tagLabel(tag)}
                    </span>
                  ))}
                </div>

                <div className="mt-auto border-t border-border pt-3">
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <SparklesIcon className="size-3 text-ember" aria-hidden="true" />
                    Top of their shelf
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {top.map(({ resource }) => (
                      <li
                        key={resource.id}
                        className="truncate text-sm"
                        title={`${resource.title} · ${typeLabel(resource.type)}`}
                      >
                        {resource.title}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={`/people/${persona.id}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-brand-ink after:absolute after:inset-0 after:rounded-xl hover:underline"
                >
                  Open {persona.name.split(" ")[0]}&rsquo;s shelf
                  <ArrowUpRightIcon className="size-3" aria-hidden="true" />
                </Link>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
