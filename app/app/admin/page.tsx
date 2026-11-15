import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { headers } from "next/headers";
import { requireCompanyAdmin } from "@/lib/auth";
import { q } from "@/lib/db";
import { companyPeople } from "@/lib/team";
import { relativeTime } from "@/lib/insights";
import { PageHeader, PageSkeleton } from "@/components/page-header";
import { CompanyRoleSelect, CompanySettingsForm, InviteManager, JoinRequestButtons } from "@/components/app-controls";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Company admin" };

async function Admin() {
  const viewer = await requireCompanyAdmin();
  const { companyId, companyName, companyDomain, plan } = viewer.membership;
  const [people, invites, host, requests] = await Promise.all([
    companyPeople(companyId),
    q<{ code: string; role: string; created_at: Date | string }>(
      "select code, role, created_at from invites where company_id = $1 and revoked = false order by created_at desc",
      [companyId],
    ),
    headers().then((list) => list.get("x-forwarded-host") ?? list.get("host") ?? ""),
    q<{ id: string; name: string; email: string; created_at: Date | string }>(
      `select u.id, u.name, u.email, r.created_at from join_requests r join users u on u.id = r.user_id
        where r.company_id = $1 order by r.created_at asc`,
      [companyId],
    ),
  ]);
  const protocol = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  const origin = `${protocol}://${host}`;
  const emailDomain = viewer.email.split("@")[1] ?? "";

  return (
    <div className="app-page grid grid-cols-1 gap-10">
      <PageHeader
        title="Company admin"
        description={`Settings, people and data for ${companyName}.`}
        actions={
          <Button asChild variant="outline">
            <a href="/app/admin/export" download>
              Export activity (CSV)
            </a>
          </Button>
        }
      />

      {requests.length ? (
        <section aria-labelledby="requests" className="surface grid gap-4 border-tint-yellow-ink/30 p-6">
          <div>
            <h2 id="requests" className="text-sm font-semibold">
              Join requests · {requests.length}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              They signed up with your company&rsquo;s email domain. Only approve people you recognise.
            </p>
          </div>
          <ul className="grid divide-y divide-border rounded-lg border border-border">
            {requests.map((request) => (
              <li key={request.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <UserAvatar name={request.name} seed={request.id} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{request.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {request.email} · asked {relativeTime(new Date(request.created_at).toISOString())}
                  </span>
                </span>
                <JoinRequestButtons userId={request.id} name={request.name} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface p-6">
          <h2 className="text-sm font-semibold">Workspace</h2>
          <div className="mt-4">
            <CompanySettingsForm name={companyName} domain={companyDomain ?? ""} emailDomain={emailDomain} />
          </div>
        </section>
        <section className="surface grid content-start gap-4 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Plan</h2>
            <span className="tag">{plan}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Starter is free for up to 10 people. Team adds insights for unlimited people; Enterprise adds SSO
            (Okta, Microsoft Entra ID, Google), SCIM and audit logs.
          </p>
          <p className="text-sm">
            {people.length} of {plan === "starter" ? "10" : "unlimited"} seats used.
          </p>
          <Button asChild className="justify-self-start">
            <Link href="/contact-sales?plan=enterprise">Talk to sales</Link>
          </Button>
        </section>
      </div>

      <section className="surface grid gap-4 p-6">
        <div>
          <h2 className="text-sm font-semibold">Invite links</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Anyone with a link joins straight away.{" "}
            {companyDomain ? `People with @${companyDomain} emails can also ask to join; you approve them above.` : ""}
          </p>
        </div>
        <InviteManager
          invites={invites.map((invite) => ({
            code: invite.code,
            role: invite.role,
            createdAt: new Date(invite.created_at).toISOString(),
          }))}
          origin={origin}
        />
      </section>

      <section aria-labelledby="people" className="grid gap-4">
        <h2 id="people" className="text-lg font-semibold tracking-tight">
          People · {people.length}
        </h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Person</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 text-right font-medium">Libraries</th>
                <th className="px-4 py-3 font-medium">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {people.map((person) => (
                <tr key={person.id}>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2.5">
                      <UserAvatar name={person.name} seed={person.id} size="sm" />
                      <span>
                        <span className="font-medium">{person.name}</span>
                        <span className="block text-xs text-muted-foreground">{person.email}</span>
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{relativeTime(person.joinedAt)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{person.libraries}</td>
                  <td className="px-4 py-3">
                    <CompanyRoleSelect userId={person.id} role={person.role} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Admin />
    </Suspense>
  );
}
