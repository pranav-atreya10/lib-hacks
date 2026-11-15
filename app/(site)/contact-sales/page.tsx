import type { Metadata } from "next";
import { Suspense } from "react";
import { ContactSalesForm } from "@/components/contact-sales-form";

export const metadata: Metadata = {
  title: "Talk to sales",
  description: "SSO, SCIM, data export and company-wide rollout.",
};

async function FormWithPlan({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams;
  const label = plan === "team" ? "Team" : plan === "enterprise" ? "Enterprise" : "";
  return <ContactSalesForm plan={label} />;
}

export default function ContactSalesPage({ searchParams }: PageProps<"/contact-sales">) {
  return (
    <div className="page-shell grid gap-12 py-20 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <h1 className="font-display text-[2.5rem] leading-tight">Talk to sales</h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          Rolling out to a whole company? We&rsquo;ll set up SSO, bring your people in, and help pick
          the first libraries.
        </p>
        <ul className="mt-8 grid gap-2 text-sm text-muted-foreground">
          <li>SSO with Okta, Microsoft Entra ID or Google</li>
          <li>SCIM provisioning and audit logs</li>
          <li>Team pricing for unlimited people</li>
        </ul>
      </div>
      <div className="surface p-8">
        <Suspense fallback={null}>
          <FormWithPlan searchParams={searchParams as Promise<{ plan?: string }>} />
        </Suspense>
      </div>
    </div>
  );
}
