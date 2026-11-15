import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { companyStats, libraryItems, personActivity } from "@/lib/library";
import { buildCards, monthLabel, currentMonth } from "@/lib/insights";
import { companyPeople, getLibrary, giveaways, libraryMembers } from "@/lib/team";
import { COLLECTIONS } from "@/lib/marketplace";
import { PageHeader, PageSkeleton } from "@/components/page-header";
import { LibraryBrowser } from "@/components/library-browser";
import { RecommendDialog } from "@/components/recommend-dialog";
import { UserAvatar } from "@/components/user-avatar";
import { AddMember, CollectionToggle, JoinLibraryButton, MemberRoleControls } from "@/components/app-controls";
import { Button } from "@/components/ui/button";
import { LockIcon, PlusIcon, SparklesIcon, UsersIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Library" };

async function Library({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await requireMember();
  const { companyId, interests } = viewer.membership;
  const library = await getLibrary(companyId, id);
  if (!library) notFound();
  const members = await libraryMembers(id, companyId);
  const me = members.find((member) => member.id === viewer.id);
  if (!me && library.visibility === "private" && viewer.membership.role !== "admin") notFound();
  const isAdmin = me?.role === "admin" || viewer.membership.role === "admin";

  const [items, stats, activity, prize, people] = await Promise.all([
    libraryItems(companyId, [id]),
    companyStats(companyId),
    personActivity(companyId, viewer.id),
    giveaways([id]).then((rows) => rows[0] ?? null),
    isAdmin ? companyPeople(companyId) : Promise.resolve([]),
  ]);
  const cards = buildCards(items, stats, interests, activity);
  const notMembers = people.filter((person) => !members.some((member) => member.id === person.id));

  return (
    <div className="app-page grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="grid min-w-0 grid-cols-1 content-start gap-10">
        <PageHeader
          eyebrow={
            <span className="flex flex-wrap gap-1.5">
              {library.isDefault ? <span className="tag">Company-wide</span> : null}
              {library.visibility === "private" ? (
                <span className="tag">
                  <LockIcon className="size-3" aria-hidden="true" /> Private
                </span>
              ) : null}
              {isAdmin ? <span className="tag bg-tint-blue text-tint-blue-ink">You&rsquo;re an admin</span> : null}
            </span>
          }
          title={library.name}
          description={library.description || `${members.length} members`}
          actions={
            <>
              {me ? (
                <RecommendDialog libraryId={id} libraryName={library.name}>
                  <Button>
                    <PlusIcon className="size-4" aria-hidden="true" /> Recommend
                  </Button>
                </RecommendDialog>
              ) : null}
              {isAdmin ? (
                <Button asChild variant="outline">
                  <Link href={`/app/libraries/${id}/insights`}>
                    <UsersIcon className="size-4" aria-hidden="true" /> Team insights
                  </Link>
                </Button>
              ) : null}
              {library.isDefault ? null : (
                <JoinLibraryButton libraryId={id} joined={!!me} isPrivate={library.visibility === "private"} />
              )}
            </>
          }
        />

        <LibraryBrowser
          cards={cards}
          firstName={viewer.name.split(" ")[0]}
          empty={
            <div className="grid place-items-center gap-3 rounded-xl border border-dashed border-border px-6 py-16 text-center">
              <p className="font-medium">This shelf is empty.</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {isAdmin ? "Add a collection on the right, or recommend something." : "Recommend the first thing on it."}
              </p>
            </div>
          }
        />
      </div>

      <aside className="grid content-start gap-6 xl:sticky xl:top-8 xl:self-start">
        {prize || isAdmin ? (
          <section className="rounded-xl bg-tint-yellow p-5 text-tint-yellow-ink">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <SparklesIcon className="size-4" aria-hidden="true" /> {monthLabel(currentMonth())} giveaway
            </h2>
            <p className="mt-2 text-sm">
              {prize?.winnerName
                ? `${prize.winnerName} won${prize.prize ? ` ${prize.prize}` : ""}.`
                : prize?.prize
                  ? `${prize.prize}. The admin picks a winner at month end.`
                  : "No prize set yet."}
            </p>
            {isAdmin ? (
              <Link href={`/app/libraries/${id}/insights#giveaway`} className="mt-3 inline-block text-sm font-medium underline">
                Manage giveaway
              </Link>
            ) : null}
          </section>
        ) : null}

        <section className="surface p-5" aria-labelledby="members-heading">
          <h2 id="members-heading" className="text-sm font-semibold">
            Members · {members.length}
          </h2>
          <ul className="mt-4 grid gap-3">
            {members.map((member) => (
              <li key={member.id} className="flex items-center gap-2.5 text-sm">
                <UserAvatar name={member.name} seed={member.id} size="xs" />
                <span className="min-w-0 flex-1 truncate">
                  {member.name}
                  {member.role === "admin" ? <span className="text-muted-foreground"> · admin</span> : null}
                </span>
                {isAdmin && !library.isDefault ? (
                  <MemberRoleControls libraryId={id} userId={member.id} role={member.role} isSelf={member.id === viewer.id} />
                ) : null}
              </li>
            ))}
          </ul>
          {isAdmin && !library.isDefault ? (
            <div className="mt-4">
              <AddMember libraryId={id} people={notMembers.map((person) => ({ id: person.id, name: person.name }))} />
            </div>
          ) : null}
        </section>

        <section className="surface p-5" aria-labelledby="collections-heading">
          <h2 id="collections-heading" className="text-sm font-semibold">
            Collections
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">Topic bundles from the marketplace.</p>
          <ul className="mt-4 grid gap-2.5">
            {COLLECTIONS.filter((collection) => isAdmin || library.collections.includes(collection.key)).map((collection) => (
              <li key={collection.key} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{collection.name}</span>
                {isAdmin ? (
                  <CollectionToggle
                    libraryId={id}
                    collectionKey={collection.key}
                    name={collection.name}
                    added={library.collections.includes(collection.key)}
                  />
                ) : null}
              </li>
            ))}
            {!isAdmin && library.collections.length === 0 ? (
              <li className="text-sm text-muted-foreground">Only recommendations so far.</li>
            ) : null}
          </ul>
        </section>
      </aside>
    </div>
  );
}

export default function LibraryPage({ params }: PageProps<"/app/libraries/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Library params={params} />
    </Suspense>
  );
}
