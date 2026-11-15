import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireMember } from "@/lib/auth";
import { companyLibraries, type LibrarySummary } from "@/lib/library";
import { collectionByKey } from "@/lib/marketplace";
import { PageHeader, PageSkeleton } from "@/components/page-header";
import { CreateLibraryButton, JoinLibraryButton } from "@/components/app-controls";
import { LockIcon, UsersIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Libraries" };

function LibraryCard({ library }: { library: LibrarySummary }) {
  return (
    <article className="lift relative flex h-full flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-muted text-sm font-semibold">
          {library.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="flex gap-1.5">
          {library.visibility === "private" ? (
            <span className="tag">
              <LockIcon className="size-3" aria-hidden="true" /> Private
            </span>
          ) : null}
          {library.myRole === "admin" ? <span className="tag bg-tint-blue text-tint-blue-ink">Admin</span> : null}
        </span>
      </div>
      <div>
        <h3 className="text-base font-semibold">
          <Link href={`/app/libraries/${library.id}`} className="after:absolute after:inset-0 after:rounded-xl">
            {library.name}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{library.description || "No description yet."}</p>
      </div>
      <p className="mt-auto flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
        <UsersIcon className="size-3.5" aria-hidden="true" />
        {library.members} {library.members === 1 ? "member" : "members"}
        {library.collections.length
          ? ` · ${library.collections.map((key) => collectionByKey(key)?.name.split(" ")[0]).join(", ")}`
          : ""}
      </p>
    </article>
  );
}

async function Libraries() {
  const viewer = await requireMember();
  const all = await companyLibraries(viewer.membership.companyId, viewer.id);
  const mine = all.filter((library) => library.myRole);
  const others = all.filter((library) => !library.myRole);

  return (
    <div className="app-page grid grid-cols-1 gap-12">
      <PageHeader
        title="Libraries"
        description="Like group chats for reading: a library for your team, your practice, your office or a topic. Join as many as you like."
        actions={<CreateLibraryButton />}
      />
      <section aria-labelledby="mine" className="grid gap-4">
        <h2 id="mine" className="text-lg font-semibold tracking-tight">
          Yours
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {mine.map((library) => (
            <li key={library.id}>
              <LibraryCard library={library} />
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="others" className="grid gap-4">
        <h2 id="others" className="text-lg font-semibold tracking-tight">
          Others at {viewer.membership.companyName}
        </h2>
        {others.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {others.map((library) => (
              <li key={library.id} className="grid gap-2">
                <LibraryCard library={library} />
                <JoinLibraryButton libraryId={library.id} joined={false} isPrivate={library.visibility === "private"} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            You&rsquo;re in every open library. Start one for your team.
          </p>
        )}
      </section>
    </div>
  );
}

export default function LibrariesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Libraries />
    </Suspense>
  );
}
