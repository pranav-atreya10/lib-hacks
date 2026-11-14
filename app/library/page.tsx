import type { Metadata } from "next";
import { RESOURCES, tagCounts } from "@/lib/content";
import { offices } from "@/lib/offices";
import { TAGS, tagLabel, type TagId } from "@/lib/tags";
import { LibraryExplorer } from "@/components/library-explorer";

export const metadata: Metadata = {
  title: "Library",
  description:
    "Every book, podcast, video and article the company recommends, tagged and filterable by office.",
};

export default function LibraryPage() {
  const counts = tagCounts();
  const tags = TAGS.map((tag) => [tag, counts.get(tag) ?? 0] as [string, number])
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1] || tagLabel(a[0] as TagId).localeCompare(tagLabel(b[0] as TagId)));

  return (
    <div className="page-shell py-8 sm:py-10">
      <header className="max-w-2xl">
        <h1 className="text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
          The library
        </h1>
        <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
          Files filed by {offices.length} offices. Open a folder or filter by what
          you feel like, not by what you think you should read.
        </p>
      </header>

      <div className="mt-6">
        <LibraryExplorer
          resources={RESOURCES}
          offices={offices}
          tagCounts={tags}
        />
      </div>
    </div>
  );
}
