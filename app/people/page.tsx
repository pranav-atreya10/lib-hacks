import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRightIcon, SparklesIcon } from "lucide-react";
import { PERSONAS, initials } from "@/lib/personas";
import { officeBySlug } from "@/lib/offices";
import { RESOURCES } from "@/lib/content";
import { emptyEngagement, rankResources } from "@/lib/personalize";
import { tagLabel } from "@/lib/tags";
import { typeLabel } from "@/lib/media";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "People",
  description:
    "Six readers, six shelves. See how the same library ranks for different people — and borrow a shelf that isn't yours.",
};

export default function PeoplePage() {
  return (
    <div className="page-shell py-8 sm:py-10">
      <header className="max-w-2xl">
        <p className="catalog-code">{site.purpose}</p>
        <h1 className="mt-1 text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
          Six people, six shelves
        </h1>
        <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
          The same 243 files rank differently for each of them. Open a shelf to see
          what rises to the top — then add something of your own.
        </p>
      </header>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PERSONAS.map((persona) => {
          const office = officeBySlug.get(persona.office);
          const top = rankResources(RESOURCES, persona, emptyEngagement).slice(0, 2);

          return (
            <li key={persona.id}>
              <article className="flex h-full flex-col gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-brand/40">
                <div className="flex items-start gap-3">
                  <span
                    className="grid size-10 shrink-0 place-items-center rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: persona.accent }}
                    aria-hidden="true"
                  >
                    {initials(persona.name)}
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold">
                      {persona.name}{" "}
                      <span className="font-normal text-muted-foreground">
                        · {persona.age}
                      </span>
                    </h2>
                    <p className="text-[0.75rem] text-muted-foreground">
                      {persona.role} · {office?.city}
                    </p>
                  </div>
                </div>

                <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
                  {persona.blurb}
                </p>

                <div className="flex flex-wrap gap-1">
                  {persona.traits.map((trait) => (
                    <span
                      key={trait}
                      className="rounded-full border border-border px-1.5 py-0.5 text-[0.65rem] text-muted-foreground"
                    >
                      {trait}
                    </span>
                  ))}
                  {persona.interests.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-brand/10 px-1.5 py-0.5 text-[0.65rem] text-brand-ink"
                    >
                      {tagLabel(tag)}
                    </span>
                  ))}
                </div>

                <div className="mt-auto border-t border-border pt-3">
                  <p className="flex items-center gap-1 text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
                    <SparklesIcon className="size-3 text-ember" aria-hidden="true" />
                    Top of their shelf
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {top.map(({ resource }) => (
                      <li
                        key={resource.id}
                        className="truncate text-[0.8125rem]"
                        title={`${resource.title} · ${typeLabel(resource.type)}`}
                      >
                        {resource.title}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={`/people/${persona.id}`}
                  className="inline-flex items-center gap-1 text-[0.8125rem] text-brand-ink hover:underline"
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
