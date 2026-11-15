import { HeartIcon, SparklesIcon, TrendingUpIcon } from "@/components/icons";
import { CATALOG } from "@/lib/catalog";
import { Cover } from "@/components/cover";

/** Where each cover sits in the fan: left %, top px, rotation, stacking. */
const FAN: { slug: string; left: string; top: number; rotate: number; z: number }[] = [
  { slug: "sapiens", left: "0%", top: 70, rotate: -8, z: 1 },
  { slug: "how-great-leaders-inspire-action", left: "22%", top: 10, rotate: -2, z: 3 },
  { slug: "hidden-brain", left: "46%", top: 64, rotate: 5, z: 2 },
  { slug: "mindset", left: "8%", top: 232, rotate: 3, z: 4 },
  { slug: "the-power-of-vulnerability", left: "40%", top: 238, rotate: -4, z: 5 },
];

/**
 * The product on the landing page: a fan of real covers from the catalogue,
 * with the ideas that make it different pinned on top.
 */
export function HeroArt() {
  const items = FAN.flatMap((spot) => {
    const item = CATALOG.find((entry) => entry.slug === spot.slug);
    return item ? [{ spot, item }] : [];
  });

  return (
    <div aria-hidden="true" className="relative hidden h-[460px] select-none lg:block">
      {items.map(({ spot, item }) => (
        <div
          key={item.slug}
          className="absolute w-[58%] overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-lift)]"
          style={{ left: spot.left, top: spot.top, transform: `rotate(${spot.rotate}deg)`, zIndex: spot.z }}
        >
          <Cover item={item} eager />
        </div>
      ))}

      <div className="absolute top-0 right-0 z-10 flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm shadow-[var(--shadow-lift)]">
        <TrendingUpIcon className="size-4 text-tint-green-ink" />
        Leadership reads <strong className="font-semibold">+38%</strong> this month
      </div>

      <div className="absolute top-[42%] -left-6 z-10 flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium tabular-nums shadow-[var(--shadow-lift)]">
        <HeartIcon className="size-4 fill-rose-500 text-rose-500" />
        24 likes from your team
      </div>

      <div className="absolute right-2 bottom-2 z-10 flex items-center gap-2 rounded-full bg-tint-yellow px-4 py-2 text-sm font-medium text-tint-yellow-ink ring-1 ring-tint-yellow-ink/15">
        <SparklesIcon className="size-4" />
        Outside your bubble
      </div>
    </div>
  );
}
