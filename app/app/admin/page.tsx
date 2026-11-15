import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { headers } from "next/headers";
import { requireCompanyAdmin } from "@/lib/auth";
import { q } from "@/lib/db";
import { companyPeople } from "@/lib/team";
import { relativeTime } from "@/lib/insights";
import { PageHeader, PageSkeleton } from "@/components/page-header";
import { CompanyRoleSelect, CompanySettingsForm, InviteManager } from "@/components/app-controls";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Company admin" };

async function Admin() {
  const viewer = await requireCompanyAdmin();
  const { companyId, companyName, companyDomain, plan } = viewer.membership;
  const [people, invites, host] = await Promise.all([
    companyPeople(companyId),
    q<{ code: string; role: string; created_at: Date | string }>(
      "select code, role, created_at from invites where company_id = $1 and revoked = false order by created_at desc",
      [companyId],
    ),
    headers().then((list) => list.get("x-forwarded-host") ?? list.get("host") ?? ""),
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
            Anyone with a link can join. {companyDomain ? `People with @${companyDomain} emails join without one.` : ""}
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
