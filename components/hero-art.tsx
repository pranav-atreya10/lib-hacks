import { FolderIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { RESOURCES } from "@/lib/content";

type Tone = "ink" | "brand" | "ember" | "faint" | "paper";

const TONE: Record<Tone, string> = {
  ink: "bg-foreground/80",
  brand: "bg-brand/85",
  ember: "bg-ember/80",
  faint: "bg-muted-foreground/30",
  paper: "bg-card border border-border",
};

/** [width in px, height as % of the shelf, tone] — fixed so nothing shifts on hydration. */
const SHELVES: Array<Array<[number, number, Tone]>> = [
  [
    [11, 92, "ink"],
    [7, 74, "faint"],
    [14, 100, "brand"],
    [9, 68, "paper"],
    [12, 86, "faint"],
    [8, 96, "ember"],
    [16, 78, "ink"],
    [7, 88, "paper"],
    [13, 72, "brand"],
    [10, 98, "faint"],
    [8, 80, "ink"],
    [15, 90, "paper"],
    [9, 66, "faint"],
    [12, 94, "ink"],
  ],
  [
    [9, 80, "paper"],
    [15, 96, "ink"],
    [8, 70, "brand"],
    [12, 88, "faint"],
    [10, 100, "ember"],
    [7, 76, "paper"],
    [14, 84, "ink"],
    [11, 68, "faint"],
    [9, 92, "brand"],
    [16, 78, "paper"],
    [8, 86, "ink"],
    [13, 72, "faint"],
    [10, 96, "ink"],
  ],
  [
    [13, 84, "faint"],
    [8, 68, "ink"],
    [11, 98, "paper"],
    [15, 76, "brand"],
    [9, 88, "faint"],
    [12, 70, "ink"],
    [7, 94, "paper"],
    [14, 82, "ember"],
    [10, 66, "faint"],
    [8, 90, "ink"],
    [16, 78, "paper"],
    [11, 96, "brand"],
    [9, 72, "faint"],
    [12, 86, "ink"],
  ],
];

/**
 * Decorative only: a shelf of spines, the library's own texture, so the poster
 * side of the landing page has something to look at. Hidden on small screens.
 */
export function HeroArt() {
  return (
    <div aria-hidden="true" className="relative hidden select-none lg:block">
      <div className="pointer-events-none absolute inset-x-2 -inset-y-8 rounded-[3rem] bg-gradient-to-tr from-brand/10 via-transparent to-ember/10 blur-2xl" />

      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-muted/70 via-muted/30 to-background p-6 shadow-sm">
        <div className="flex items-center justify-between text-[0.65rem] font-medium tracking-[0.16em] text-muted-foreground uppercase">
          <span className="flex items-center gap-1.5">
            <FolderIcon className="size-3.5 text-brand" />
            Shelf 04
          </span>
          <span className="font-mono tracking-[0.08em]">New York</span>
        </div>

        <div className="mt-6 space-y-6">
          {SHELVES.map((shelf, index) => (
            <div key={index}>
              <div className="flex h-[104px] items-end gap-[3px]">
                {shelf.map(([width, height, tone], spine) => (
                  <span
                    key={spine}
                    style={{ width, height: `${height}%` }}
                    className={cn("rounded-t-[3px] rounded-b-[2px]", TONE[tone])}
                  />
                ))}
              </div>
              <div className="mt-1 h-px w-full bg-border" />
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between text-[0.7rem] text-muted-foreground">
          <span>Books, shows, talks, articles</span>
          <span className="font-mono tabular-nums">{RESOURCES.length} files</span>
        </div>
      </div>
    </div>
  );
}
