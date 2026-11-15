"use client";

import { useActionState } from "react";
import { submitSalesLead, type FormState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { CheckCircle2Icon } from "@/components/icons";
import { Field, inputClass } from "@/components/field";

export function ContactSalesForm({ plan }: { plan: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitSalesLead, {});

  if (state.ok) {
    return (
      <div role="status" className="flex items-start gap-3 rounded-lg bg-tint-green p-5 text-tint-green-ink">
        <CheckCircle2Icon className="mt-0.5 size-5 shrink-0" />
        <p className="text-sm">{state.ok}</p>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name">
          <input name="name" required autoComplete="name" className={inputClass} />
        </Field>
        <Field label="Work email">
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company">
          <input name="company" required autoComplete="organization" className={inputClass} />
        </Field>
        <Field label="Company size">
          <select name="size" defaultValue="" className={inputClass}>
            <option value="" disabled>
              Choose one
            </option>
            <option>1–50</option>
            <option>51–250</option>
            <option>251–1,000</option>
            <option>1,000+</option>
          </select>
        </Field>
      </div>
      <Field label="What are you looking for?">
        <textarea
          name="message"
          rows={4}
          defaultValue={plan ? `Interested in the ${plan} plan.` : ""}
          className={`${inputClass} h-auto py-2`}
        />
      </Field>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={pending} className="justify-self-start">
        {pending ? "Sending…" : "Talk to sales"}
      </Button>
    </form>
  );
}
