import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SignUpForm } from "@/components/auth-forms";
import { connection } from "next/server";
import { one } from "@/lib/db";

export const metadata: Metadata = { title: "Create an account" };

async function Form({ searchParams }: { searchParams: Promise<{ invite?: string }> }) {
  await connection();
  const { invite } = await searchParams;
  const code = typeof invite === "string" ? invite.slice(0, 40) : "";
  const company = code
    ? await one<{ name: string }>(
        "select c.name from invites i join companies c on c.id = i.company_id where i.code = $1 and i.revoked = false",
        [code],
      )
    : null;
  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight">
        {company ? `Join ${company.name}` : "Create your account"}
      </h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        {company
          ? "You've been invited to your company's library."
          : "Start a library for your company, or join the one you're already in."}
      </p>
      <SignUpForm invite={company ? code : ""} companyName={company?.name ?? null} />
    </>
  );
}

export default function SignUpPage({ searchParams }: PageProps<"/sign-up">) {
  return (
    <div className="surface w-full max-w-sm p-8">
      <Suspense fallback={null}>
        <Form searchParams={searchParams as Promise<{ invite?: string }>} />
      </Suspense>
      <p className="mt-6 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
