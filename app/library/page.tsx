import type { Metadata } from "next";
import { COMPANY_RESOURCES } from "@/lib/content";
import { COMPANY_SLUG, offices } from "@/lib/offices";
import { LibraryExplorer } from "@/components/library-explorer";
import { LibraryDashboard } from "@/components/library-dashboard";
import { OfficeFolders } from "@/components/office-folders";
import { PersonaSwitcher } from "@/components/persona-switcher";
import { TourButton } from "@/components/tour";

export const metadata: Metadata = {
  title: "Library",
  description:
    "Office folders, the company-wide shelf, and a ranking for whoever is reading. No sign-in.",
};

export default function LibraryPage() {
  return (
    <div className="page-shell grid grid-cols-1 gap-16 py-10 sm:gap-20 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <h1 className="font-display text-[3rem] leading-none sm:text-[4rem]">The library</h1>
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted-foreground sm:text-base">
            {offices.length} office folders and one shelf for the whole company. Pick who&rsquo;s
            reading, then open what you wouldn&rsquo;t normally pick.
          </p>
        </div>
        <TourButton />
      </header>

      <div className="grid grid-cols-1 gap-10">
        <PersonaSwitcher />
        <LibraryDashboard />
      </div>

      <OfficeFolders />

      <section aria-labelledby="company-heading" className="grid grid-cols-1 gap-6">
        <div>
          <h2 id="company-heading" className="text-lg font-semibold">
            Company shelf
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            {COMPANY_RESOURCES.length} files picked for everyone, not filed under any office.
            Office picks live inside their folders above.
          </p>
        </div>
        <LibraryExplorer shelf={COMPANY_SLUG} tour />
      </section>
    </div>
  );
}
