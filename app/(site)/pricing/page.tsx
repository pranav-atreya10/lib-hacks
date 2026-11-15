import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Free for small teams. Talk to sales for Team and Enterprise.",
};

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    note: "Up to 10 people",
    cta: { label: "Get started", href: "/sign-up" },
    features: [
      "Unlimited libraries and members' recommendations",
      "All marketplace collections",
      "Likes, reviews, tags and personal rankings",
      "Company trends",
    ],
    featured: false,
  },
  {
    name: "Team",
    price: "Talk to sales",
    note: "Per person, billed yearly",
    cta: { label: "Talk to sales", href: "/contact-sales?plan=team" },
    features: [
      "Everything in Starter, for unlimited people",
      "Team insights and coaching for library admins",
      "Assigned reads and monthly giveaways",
      "Join by work-email domain",
      "CSV data export",
    ],
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Talk to sales",
    note: "For larger organisations",
    cta: { label: "Talk to sales", href: "/contact-sales?plan=enterprise" },
    features: [
      "Everything in Team",
      "SSO with Okta, Microsoft Entra ID and Google (SAML / OIDC)",
      "SCIM user provisioning",
      "Audit log and data-retention controls",
      "Dedicated success manager",
    ],
    featured: false,
  },
];

export default function PricingPage() {
  return (
    <div className="page-shell py-20">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-[2.5rem] leading-tight">Pricing</h1>
        <p className="mt-3 text-muted-foreground">
          Start free. When you&rsquo;re ready to roll it out company-wide, we&rsquo;ll set it up with you.
        </p>
      </header>

      <div className="mt-14 grid gap-4 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <section
            key={plan.name}
            aria-labelledby={`plan-${plan.name}`}
            className={cn("surface flex flex-col p-8", plan.featured && "border-foreground/60")}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 id={`plan-${plan.name}`} className="text-lg font-semibold">
                {plan.name}
              </h2>
              {plan.featured ? <span className="tag bg-tint-blue text-tint-blue-ink">Most popular</span> : null}
            </div>
            <p className="mt-6 text-3xl font-semibold tracking-tight">{plan.price}</p>
            <p className="mt-1 text-sm text-muted-foreground">{plan.note}</p>
            <ul className="mt-8 grid gap-3 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <CheckIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button asChild className="mt-auto w-full" variant={plan.featured ? "default" : "outline"} size="lg">
              <Link href={plan.cta.href} className="mt-10">
                {plan.cta.label}
              </Link>
            </Button>
          </section>
        ))}
      </div>
    </div>
  );
}
