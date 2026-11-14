import type { Metadata } from "next";
import { COMPANY_RESOURCES, typeCounts } from "@/lib/content";
import { COMPANY_SLUG, offices } from "@/lib/offices";
import { site } from "@/lib/site";
import { LibraryExplorer } from "@/components/library-explorer";
import { LibraryDashboard } from "@/components/library-dashboard";
import { OfficeFolders, OtherOffices } from "@/components/office-folders";
import { PersonaSwitcher } from "@/components/persona-switcher";
import { GetStarted } from "@/components/get-started";
import { BrandMark } from "@/components/brand-mark";
import { TourButton } from "@/components/tour";
import { BookOpenIcon, FileTextIcon, MicIcon, PlayIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Library",
  description:
    "Office folders, the company-wide shelf, and a ranking for whoever is reading. No sign-in.",
};

export default function LibraryPage() {
  const counts = typeCounts();
  const chips = [
    { label: "Books", count: counts.book, icon: BookOpenIcon },
    { label: "Podcasts", count: counts.podcast, icon: MicIcon },
    { label: "Videos", count: counts.video, icon: PlayIcon },
    { label: "Articles", count: counts.article, icon: FileTextIcon },
  ];

  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-14 px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-2xl">
          <BrandMark className="size-16 rounded-xl" />
          <h1 className="mt-5 font-display text-[2.25rem] leading-tight">The library</h1>
          <p className="mt-2 text-[0.9375rem] text-muted-foreground">
            {site.purpose} {offices.length} office folders and one shelf for the whole company,
            ranked for whoever is reading.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="What's in the library">
            {chips.map(({ label, count, icon: Icon }) => (
              <li
                key={label}
                className="flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs text-muted-foreground"
              >
                <Icon className="size-3.5" aria-hidden="true" />
                <span className="font-medium text-foreground tabular-nums">{count}</span> {label}
              </li>
            ))}
          </ul>
        </div>
        <TourButton />
      </header>

      <PersonaSwitcher />

      <OfficeFolders />

      <GetStarted />

      <LibraryDashboard />

      <section aria-labelledby="company-heading" className="grid grid-cols-1 gap-6">
        <div>
          <h2 id="company-heading" className="text-lg font-semibold tracking-tight">
            Company shelf
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            {COMPANY_RESOURCES.length} files picked for everyone, not filed under any office.
            Office picks live inside their folders.
          </p>
        </div>
        <LibraryExplorer shelf={COMPANY_SLUG} tour />
      </section>

      <OtherOffices />
    </div>
  );
}
