import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { companyStats, libraryItems, personActivity } from "@/lib/library";
import { currentMonth, monthLabel, personInsights, relativeTime, requestTime } from "@/lib/insights";
import { assignments, getLibrary, giveaways, libraryMembers, monthScores } from "@/lib/team";
import { PageHeader, PageSkeleton, Stat } from "@/components/page-header";
import { UserAvatar } from "@/components/user-avatar";
import { GiveawayControls } from "@/components/app-controls";
import { ArrowLeftIcon, SparklesIcon } from "@/components/icons";
import { TAGS, tagLabel, type TagId } from "@/lib/tags";

export const metadata: Metadata = { title: "Team insights" };

const DAY = 86_400_000;

async function Insights({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await requireMember();
  const { companyId } = viewer.membership;
  const library = await getLibrary(companyId, id);
  if (!library) notFound();
  const members = await libraryMembers(id, companyId);
  const me = members.find((member) => member.id === viewer.id);
  if (me?.role !== "admin" && viewer.membership.role !== "admin") redirect(`/app/libraries/${id}`);

  const [allItems, shelf, stats, scores, prize, assigned] = await Promise.all([
    libraryItems(companyId),
    libraryItems(companyId, [id]),
    companyStats(companyId),
    monthScores(companyId, members.map((member) => member.id)),
    giveaways([id]).then((rows) => rows[0] ?? null),
    assignments({ libraryId: id }, companyId),
  ]);
  const reports = await Promise.all(
    members.map(async (member) => {
      const activity = await personActivity(companyId, member.id);
      return { member, activity, insights: personInsights(member.name, allItems, stats, member.interests, activity) };
    }),
  );

  // General insights: the team as a whole.
  const now = requestTime();
  const active = reports.filter((report) => report.insights.lastActive && now - new Date(report.insights.lastActive).getTime() < 30 * DAY).length;
  const reads30 = reports.reduce((total, report) => total + report.insights.reads30, 0);
  const likes = reports.reduce((total, report) => total + report.insights.likes, 0);
  const reviews = reports.reduce((total, report) => total + report.insights.reviews, 0);
  const topicCounts = new Map<TagId, number>();
  for (const report of reports) {
    for (const topic of report.insights.topTopics) topicCounts.set(topic.tag, (topicCounts.get(topic.tag) ?? 0) + topic.count);
  }
  const shelfTopics = new Set(shelf.flatMap((item) => item.tags));
  const topics = TAGS.filter((tag) => shelfTopics.has(tag) || topicCounts.has(tag))
    .map((tag) => ({ tag, count: topicCounts.get(tag) ?? 0 }))
    .sort((a, b) => b.count - a.count);
  const maxTopic = Math.max(1, ...topics.map((topic) => topic.count));
  const blind = topics.filter((topic) => topic.count === 0).map((topic) => topic.tag);
  const idle = reports.filter((report) => !report.insights.lastActive || now - new Date(report.insights.lastActive).getTime() > 14 * DAY);
  const openAssignments = assigned.filter((entry) => !entry.completedAt).length;

  const general: string[] = [];
  if (idle.length) general.push(`${idle.length} of ${members.length} ${idle.length === 1 ? "person hasn't" : "people haven't"} been active in two weeks: ${idle.slice(0, 3).map((report) => report.member.name.split(" ")[0]).join(", ")}.`);
  if (blind.length) general.push(`Nobody has opened anything on ${blind.slice(0, 3).map(tagLabel).join(", ")} yet. Assign one short read.`);
  if (topics[0]?.count) general.push(`${tagLabel(topics[0].tag)} is the team's strongest topic this month.`);
  if (openAssignments) general.push(`${openAssignments} assigned ${openAssignments === 1 ? "read is" : "reads are"} still open.`);
  if (general.length === 0) general.push("The team is just getting started. Assign a first read to everyone.");

  const candidates = members
    .map((member) => ({ id: member.id, name: member.name, score: scores.get(member.id) ?? 0 }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="app-page grid grid-cols-1 gap-10">
      <Link href={`/app/libraries/${id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-3.5" aria-hidden="true" /> {library.name}
      </Link>
      <PageHeader
        title="Team insights"
        description={`${library.name} · ${members.length} members. Each person can see what you see about them.`}
      />

      <dl className="surface grid grid-cols-2 gap-6 p-6 sm:grid-cols-4">
        <Stat label="Active, 30 days" value={`${active} of ${members.length}`} />
        <Stat label="Reads, 30 days" value={reads30} />
        <Stat label="Likes" value={likes} />
        <Stat label="Reviews" value={reviews} />
      </dl>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface p-6" aria-labelledby="coverage">
          <h2 id="coverage" className="text-sm font-semibold">
            Topic coverage
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">What the team opens, likes and reviews, by topic.</p>
          <ul className="mt-4 grid gap-2.5">
            {topics.slice(0, 10).map((topic) => (
              <li key={topic.tag} className="grid grid-cols-[7.5rem_1fr_2rem] items-center gap-3 text-sm">
                <span className="truncate text-muted-foreground">{tagLabel(topic.tag)}</span>
                <span className="h-2 rounded-full bg-muted">
                  <span
                    className={topic.count ? "block h-full rounded-full bg-foreground/80" : "block h-full"}
                    style={{ width: `${(topic.count / maxTopic) * 100}%` }}
                  />
                </span>
                <span className="text-right text-xs tabular-nums">{topic.count}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="surface p-6" aria-labelledby="general">
          <h2 id="general" className="text-sm font-semibold">
            What to do next
          </h2>
          <ul className="mt-4 grid gap-3">
            {general.map((line) => (
              <li key={line} className="flex items-start gap-2 rounded-lg bg-tint-yellow px-3 py-2.5 text-sm text-tint-yellow-ink">
                <SparklesIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {line}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-labelledby="people" className="grid gap-4">
        <h2 id="people" className="text-lg font-semibold tracking-tight">
          People
        </h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[44rem] text-sm">
            <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Person</th>
                <th className="px-4 py-3 font-medium">Last active</th>
                <th className="px-4 py-3 text-right font-medium">Reads 30d</th>
                <th className="px-4 py-3 text-right font-medium">Likes</th>
                <th className="px-4 py-3 text-right font-medium">Reviews</th>
                <th className="px-4 py-3 font-medium">Top topics</th>
                <th className="px-4 py-3 text-right font-medium">Assigned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reports.map(({ member, insights }) => {
                const theirs = assigned.filter((entry) => entry.memberId === member.id);
                return (
                  <tr key={member.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <Link href={`/app/libraries/${id}/people/${member.id}`} className="flex items-center gap-2.5 font-medium hover:underline">
                        <UserAvatar name={member.name} seed={member.id} size="sm" />
                        <span>
                          {member.name}
                          <span className="block text-xs font-normal text-muted-foreground">{member.title || member.email}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{relativeTime(insights.lastActive)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{insights.reads30}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{insights.likes}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{insights.reviews}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {insights.topTopics.slice(0, 2).map((topic) => tagLabel(topic.tag)).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {theirs.filter((entry) => entry.completedAt).length}/{theirs.length}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section id="giveaway" aria-labelledby="giveaway-heading" className="surface grid gap-4 p-6">
        <div>
          <h2 id="giveaway-heading" className="text-sm font-semibold">
            {monthLabel(currentMonth())} giveaway
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Set a prize and pick the winner. Points this month: 1 per read, 2 per like, 5 per review or recommendation.
          </p>
        </div>
        <GiveawayControls libraryId={id} prize={prize?.prize ?? ""} winnerId={prize?.winnerId ?? null} candidates={candidates} />
      </section>
    </div>
  );
}

export default function InsightsPage({ params }: PageProps<"/app/libraries/[id]/insights">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Insights params={params} />
    </Suspense>
  );
}
