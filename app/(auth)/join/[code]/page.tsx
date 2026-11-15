import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { one } from "@/lib/db";
import { getViewer } from "@/lib/auth";
import { JoinCompanyForm } from "@/components/onboarding";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Join your company" };

async function Join({ params }: { params: Promise<{ code: string }> }) {
  await connection();
  const { code } = await params;
  const invite = await one<{ name: string; role: string }>(
    "select c.name, i.role from invites i join companies c on c.id = i.company_id where i.code = $1 and i.revoked = false",
    [code.slice(0, 40)],
  );
  if (!invite) {
    return (
      <>
        <h1 className="text-xl font-semibold tracking-tight">This invite has expired</h1>
        <p className="mt-2 text-sm text-muted-foreground">Ask your company admin for a new link.</p>
      </>
    );
  }
  const viewer = await getViewer();
  if (viewer?.membership) redirect("/app");
  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight">Join {invite.name}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        You&rsquo;ve been invited as {invite.role === "admin" ? "an admin" : "a member"}.
      </p>
      <div className="mt-6">
        {viewer ? (
          <JoinCompanyForm code={code} />
        ) : (
          <div className="grid gap-2">
            <Button asChild size="lg">
              <Link href={`/sign-up?invite=${encodeURIComponent(code)}`}>Create an account</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={`/sign-in?next=${encodeURIComponent(`/join/${code}`)}`}>I already have one</Link>
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

export default function JoinPage({ params }: PageProps<"/join/[code]">) {
  return (
    <div className="surface w-full max-w-sm p-8">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Checking your invite…</p>}>
        <Join params={params} />
      </Suspense>
    </div>
  );
}
