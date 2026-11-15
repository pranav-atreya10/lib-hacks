"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signIn, signUp, type FormState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/field";
import { LockIcon } from "@/components/icons";

const PROVIDERS = ["Google", "Microsoft", "Okta / SAML"];

/** SSO buttons: SSO comes with Enterprise, so they explain and point to sales. */
export function SsoButtons() {
  const [chosen, setChosen] = useState<string | null>(null);
  return (
    <div className="grid gap-2">
      {PROVIDERS.map((provider) => (
        <button
          key={provider}
          type="button"
          onClick={() => setChosen(provider)}
          className="press flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-card text-sm font-medium hover:bg-muted"
        >
          Continue with {provider}
        </button>
      ))}
      {chosen ? (
        <p role="status" className="flex items-start gap-2 rounded-md bg-tint-blue px-3 py-2.5 text-sm text-tint-blue-ink">
          <LockIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            {chosen} sign-in is part of Enterprise.{" "}
            <Link href="/contact-sales?plan=enterprise" className="font-medium underline">
              Talk to sales
            </Link>{" "}
            to turn it on — or use your email below.
          </span>
        </p>
      ) : null}
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      or with email
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, {});
  return (
    <div className="grid gap-6">
      <SsoButtons />
      <Divider />
      <form action={action} className="grid gap-4">
        <input type="hidden" name="next" value={next} />
        <Field label="Work email">
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </Field>
        <Field label="Password">
          <input name="password" type="password" required autoComplete="current-password" className={inputClass} />
        </Field>
        {state.error ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" size="lg" disabled={pending} className="w-full">
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}

export function SignUpForm({ invite, companyName }: { invite: string; companyName: string | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signUp, {});
  return (
    <div className="grid gap-6">
      {invite ? null : (
        <>
          <SsoButtons />
          <Divider />
        </>
      )}
      <form action={action} className="grid gap-4">
        <input type="hidden" name="invite" value={invite} />
        <Field label="Full name">
          <input name="name" required autoComplete="name" className={inputClass} />
        </Field>
        <Field label="Work email" hint={companyName ? undefined : "Use your work email"}>
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </Field>
        <Field label="Password" hint="At least 8 characters">
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
        </Field>
        {state.error ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" size="lg" disabled={pending} className="w-full">
          {pending ? "Creating your account…" : companyName ? `Join ${companyName}` : "Create account"}
        </Button>
      </form>
    </div>
  );
}
