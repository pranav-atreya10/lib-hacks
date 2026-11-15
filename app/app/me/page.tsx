import type { Metadata } from "next";
import { Suspense } from "react";
import { requireMember } from "@/lib/auth";
import { companyStats, libraryItems, personActivity } from "@/lib/library";
import { personInsights, relativeTime } from "@/lib/insights";
import { coachingNotes } from "@/lib/team";
import { PageHeader, PageSkeleton } from "@/components/page-header";
import { PersonReport } from "@/components/person-report";
import { ProfileForm } from "@/components/app-controls";
import { UserAvatar } from "@/components/user-avatar";
import { EyeIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Your profile" };

async function Me() {
  const viewer = await requireMember();
  const { companyId, interests, title } = viewer.membership;
  const [items, stats, activity, notes] = await Promise.all([
    libraryItems(companyId),
    companyStats(companyId),
    personActivity(companyId, viewer.id),
    coachingNotes(viewer.id, companyId),
  ]);
  const insights = personInsights(viewer.name, items, stats, interests, activity, true);

  return (
    <div className="app-page grid grid-cols-1 gap-10">
      <PageHeader
        eyebrow={<UserAvatar name={viewer.name} seed={viewer.id} size="lg" />}
        title={viewer.name}
        description={`${title || viewer.email} · ${viewer.membership.companyName}`}
      />
      <p className="flex items-start gap-2 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
        <EyeIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        This is exactly what admins of your libraries see about you: your activity, topics and coaching notes.
      </p>
      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <PersonReport firstName={viewer.name.split(" ")[0]} insights={insights} activity={activity} items={items} self />
        <aside className="grid content-start gap-6">
          <section className="surface p-5">
            <h2 className="text-sm font-semibold">Profile</h2>
            <div className="mt-4">
              <ProfileForm title={title} interests={interests} />
            </div>
          </section>
          <section className="surface p-5">
            <h2 className="text-sm font-semibold">Coaching notes</h2>
            {notes.length ? (
              <ul className="mt-4 grid gap-3">
                {notes.map((note) => (
                  <li key={note.id} className="text-sm">
                    <p className="leading-relaxed">{note.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {note.leadName} · {note.libraryName} · {relativeTime(note.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">None yet.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

export default function MePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Me />
    </Suspense>
  );
}
