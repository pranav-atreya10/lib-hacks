import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SignInForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Sign in" };

async function Form({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <SignInForm next={typeof next === "string" ? next : ""} />;
}

export default function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  return (
    <div className="surface w-full max-w-sm p-8">
      <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-1 text-sm text-muted-foreground">Welcome back to your company&rsquo;s library.</p>
      <div className="mt-6">
        <Suspense fallback={null}>
          <Form searchParams={searchParams as Promise<{ next?: string }>} />
        </Suspense>
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/sign-up" className="font-medium text-foreground underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
