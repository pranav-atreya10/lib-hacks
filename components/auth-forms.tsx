"use client";

import { useActionState } from "react";
import { signIn, signUp, type FormState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/field";

export function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, {});
  return (
    <div className="grid gap-6">
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
