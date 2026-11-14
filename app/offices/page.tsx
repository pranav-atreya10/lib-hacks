import type { Metadata } from "next";
import Link from "next/link";
import { offices, type Office } from "@/lib/offices";
import { officeCounts, resourcesByOffice } from "@/lib/content";
import { PERSONAS } from "@/lib/personas";
import { PersonaAvatar } from "@/components/persona-avatar";

export const metadata: Metadata = {
  title: "Offices",
  description: "Every office and the shelf it keeps.",
};

export default function OfficesPage() {
  const counts = officeCounts();
  const peopleOffices = new Set(PERSONAS.map((person) => person.office));
  const first = offices.filter((office) => peopleOffices.has(office.slug));
  const rest = offices.filter((office) => !peopleOffices.has(office.slug));

  return (
    <div className="page-shell grid gap-14 py-10 sm:py-14">
      <header className="max-w-2xl">
        <h1 className="font-display text-[3rem] leading-none sm:text-[3.75rem]">Office folders</h1>
        <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted-foreground">
          {offices.length} shelves, one library. Each office keeps its own picks; Florham Park and
          both New York offices keep a full ten. The offices our people work in come first.
        </p>
      </header>

      <section aria-labelledby="people-offices" className="grid gap-5">
        <h2 id="people-offices" className="text-lg font-semibold">
          Where our people work
        </h2>
        <ul className="grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {first.map((office) => (
            <li key={office.slug}>
              <OfficeCard office={office} count={counts.get(office.slug) ?? 0} withPeople />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="other-offices" className="grid gap-5">
        <h2 id="other-offices" className="text-lg font-semibold">
          Every other office
        </h2>
        <ul className="grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rest.map((office) => (
            <li key={office.slug}>
              <OfficeCard office={office} count={counts.get(office.slug) ?? 0} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function OfficeCard({
  office,
  count,
  withPeople = false,
}: {
  office: Office;
  count: number;
  withPeople?: boolean;
}) {
  const shelf = resourcesByOffice(office.slug);
  const people = PERSONAS.filter((person) => person.office === office.slug);
  return (
    <Link
      href={`/offices/${office.slug}`}
      className="folder lift flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{office.name}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {office.city}, {office.state}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium tabular-nums">
          {count}
        </span>
      </div>
      <ul className="mt-auto grid gap-1 border-t border-border pt-3 text-sm text-muted-foreground">
        {shelf.slice(0, 2).map((resource) => (
          <li key={resource.id} className="truncate">
            {resource.title}
          </li>
        ))}
      </ul>
      {withPeople && people.length > 0 ? (
        <p className="flex items-center gap-2 text-sm">
          {people.map((person) => (
            <PersonaAvatar key={person.id} persona={person} size="xs" />
          ))}
          {people.map((person) => person.name.split(" ")[0]).join(" & ")} works here
        </p>
      ) : null}
    </Link>
  );
}
