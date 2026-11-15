import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { one } from "@/lib/db";
import { CompanyStep, PendingRequest, ProfileStep } from "@/components/onboarding";

export const metadata: Metadata = { title: "Get set up" };

async function Onboarding() {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in");
  const membership = viewer.membership;
  if (membership?.onboarded) redirect("/app");

  if (!membership) {
    const pending = await one<{ name: string }>(
      "select c.name from join_requests r join companies c on c.id = r.company_id where r.user_id = $1",
      [viewer.id],
    );
    if (pending) {
      return (
        <div className="surface w-full max-w-md p-8">
          <PendingRequest companyName={pending.name} email={viewer.email} />
        </div>
      );
    }
    return (
      <div className="surface w-full max-w-md p-8">
        <h1 className="text-xl font-semibold tracking-tight">Welcome, {viewer.name.split(" ")[0]}</h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          Start your company&rsquo;s workspace, or join one with an invite link.
        </p>
        <CompanyStep email={viewer.email} />
      </div>
    );
  }

  const company = await one<{ created_by: string | null }>("select created_by from companies where id = $1", [
    membership.companyId,
  ]);
  return (
    <div className="surface w-full max-w-2xl p-8">
      <p className="text-sm text-muted-foreground">{membership.companyName}</p>
      <h1 className="mt-1 mb-6 text-xl font-semibold tracking-tight">Make the library yours</h1>
      <ProfileStep isCreator={company?.created_by === viewer.id} companyName={membership.companyName} />
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <Onboarding />
    </Suspense>
  );
}
