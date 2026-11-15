import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { companyStats, findItem, libraryItems, personActivity } from "@/lib/library";
import { personInsights, rankForPerson, relativeTime } from "@/lib/insights";
import { assignments, coachingNotes, getLibrary, libraryMembers } from "@/lib/team";
import { PageHeader, PageSkeleton } from "@/components/page-header";
import { PersonReport } from "@/components/person-report";
import { UserAvatar } from "@/components/user-avatar";
import { AssignReadForm, CoachingNoteForm, RemoveAssignmentButton } from "@/components/app-controls";
import { ArrowLeftIcon, CheckCircle2Icon } from "@/components/icons";
import { tagLabel } from "@/lib/tags";

export const metadata: Metadata = { title: "Coaching" };

async function Person({ params }: { params: Promise<{ id: string; userId: string }> }) {
  const { id, userId } = await params;
  const viewer = await requireMember();
  const { companyId } = viewer.membership;
  const library = await getLibrary(companyId, id);
  if (!library) notFound();
  const members = await libraryMembers(id, companyId);
  const me = members.find((member) => member.id === viewer.id);
  if (me?.role !== "admin" && viewer.membership.role !== "admin") redirect(`/app/libraries/${id}`);
  const person = members.find((member) => member.id === userId);
  if (!person) notFound();

  const [allItems, shelf, stats, activity, notes, theirs] = await Promise.all([
    libraryItems(companyId),
    libraryItems(companyId, [id]),
    companyStats(companyId),
    personActivity(companyId, userId),
    coachingNotes(userId, companyId, id),
    assignments({ memberId: userId, libraryId: id }, companyId),
  ]);
  const first = person.name.split(" ")[0];
  const insights = personInsights(person.name, allItems, stats, person.interests, activity);
  const options = rankForPerson(shelf, stats, person.interests, activity)
    .filter((entry) => !activity.viewed.has(entry.item.key))
    .slice(0, 25)
    .map((entry) => ({ key: entry.item.key, title: entry.item.title, hint: entry.reason ?? entry.item.creator }));
  const assignedItems = await Promise.all(theirs.map((entry) => findItem(companyId, entry.itemKey)));

  return (
    <div className="app-page grid grid-cols-1 gap-10">
      <Link href={`/app/libraries/${id}/insights`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-3.5" aria-hidden="true" /> {library.name} insights
      </Link>
      <PageHeader
        eyebrow={<UserAvatar name={person.name} seed={person.id} size="lg" />}
        title={person.name}
        description={
          <>
            {person.title || person.email} · interested in{" "}
            {person.interests.map(tagLabel).join(", ") || "nothing picked yet"}. {first} can see this report.
          </>
        }
      />

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <PersonReport firstName={first} insights={insights} activity={activity} items={allItems} self={false} />

        <aside className="grid content-start gap-6">
          <section className="surface grid gap-4 p-5" aria-labelledby="assign">
            <h2 id="assign" className="text-sm font-semibold">
              Assign a read
            </h2>
            {options.length ? (
              <AssignReadForm libraryId={id} memberId={userId} options={options} />
            ) : (
              <p className="text-sm text-muted-foreground">{first} has opened everything on this shelf.</p>
            )}
            {theirs.length ? (
              <ul className="grid gap-2 border-t border-border pt-4">
                {theirs.map((entry, index) => (
                  <li key={entry.id} className="flex items-center gap-2 text-sm">
                    {entry.completedAt ? (
                      <CheckCircle2Icon className="size-4 shrink-0 text-tint-green-ink" aria-label="Done" />
                    ) : (
                      <span className="size-4 shrink-0 rounded-full border border-border" aria-label="Open" />
                    )}
                    <span className="min-w-0 flex-1 truncate">{assignedItems[index]?.title ?? "A file"}</span>
                    <RemoveAssignmentButton libraryId={id} id={entry.id} />
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className="surface grid gap-4 p-5" aria-labelledby="notes">
            <h2 id="notes" className="text-sm font-semibold">
              Coaching notes
            </h2>
            <CoachingNoteForm libraryId={id} memberId={userId} firstName={first} />
            {notes.length ? (
              <ul className="grid gap-3 border-t border-border pt-4">
                {notes.map((note) => (
                  <li key={note.id} className="text-sm">
                    <p className="leading-relaxed">{note.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {note.leadName} · {relativeTime(note.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}

export default function PersonPage({ params }: PageProps<"/app/libraries/[id]/people/[userId]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Person params={params} />
    </Suspense>
  );
}
