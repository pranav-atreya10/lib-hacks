import type { Metadata } from "next";
import { RESOURCES, tagCounts, typeCounts } from "@/lib/content";
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
    <div className="page-shell py-10 sm:py-12">
      <header className="max-w-2xl">
        <p className="catalog-code">The library</p>
        <h1 className="mt-2 text-4xl leading-[1.05] sm:text-5xl">
          Everything we recommend.
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          {RESOURCES.length} resources kept by {offices.length} offices. Filter by
          what you feel like, not by what you think you should read.
        </p>
      </header>

      <div className="mt-8">
        <LibraryExplorer
          resources={RESOURCES}
          offices={offices}
          tagCounts={tags}
          typeCounts={typeCounts()}
        />
      </div>
    </div>
  );
}
