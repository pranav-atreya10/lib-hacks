import { HeartIcon, SparklesIcon } from "lucide-react";
import { COMPANY_RESOURCES, type Resource } from "@/lib/content";
import { getPersona } from "@/lib/personas";
import { seedStats } from "@/lib/engagement";
import { Cover } from "@/components/cover";
import { PersonaAvatar } from "@/components/persona-avatar";

/** Where each cover sits in the fan: left %, top px, rotation, stacking. */
const FAN: { slug: string; left: string; top: number; rotate: number; z: number }[] = [
  { slug: "sapiens", left: "0%", top: 70, rotate: -8, z: 1 },
  { slug: "how-great-leaders-inspire-action", left: "22%", top: 10, rotate: -2, z: 3 },
  { slug: "hidden-brain", left: "46%", top: 64, rotate: 5, z: 2 },
  { slug: "mindset", left: "8%", top: 232, rotate: 3, z: 4 },
  { slug: "the-power-of-vulnerability", left: "40%", top: 238, rotate: -4, z: 5 },
];

/**
 * The real thing on the landing page: a fan of covers straight from the
 * company shelf, with the two ideas that make it different pinned on top —
 * a ranking for one person, and picks from outside their bubble.
 */
export function HeroArt() {
  const maya = getPersona("maya-chen");
  const items = FAN.map((spot) => ({
    spot,
    resource: COMPANY_RESOURCES.find((entry) => entry.slug === spot.slug),
  })).filter((entry): entry is { spot: (typeof FAN)[number]; resource: Resource } => !!entry.resource);
  const likes = seedStats(items[1]?.resource.id ?? "").likes;

  return (
    <div aria-hidden="true" className="relative hidden h-[460px] select-none lg:block">
      {items.map(({ spot, resource }) => (
        <div
          key={resource.id}
          className="absolute w-[58%] overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-lift)]"
          style={{ left: spot.left, top: spot.top, transform: `rotate(${spot.rotate}deg)`, zIndex: spot.z }}
        >
          <Cover item={resource} eager />
        </div>
      ))}

      {maya ? (
        <div className="absolute top-0 right-0 z-10 flex items-center gap-2.5 rounded-full border border-border bg-card py-1.5 pr-4 pl-1.5 text-sm shadow-[var(--shadow-lift)]">
          <PersonaAvatar persona={maya} size="sm" />
          <span>
            Ranked for <strong className="font-semibold">Maya</strong>, New York
          </span>
        </div>
      ) : null}

      <div className="absolute top-[42%] -left-6 z-10 flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium tabular-nums shadow-[var(--shadow-lift)]">
        <HeartIcon className="size-4 fill-rose-500 text-rose-500" />
        {likes}
      </div>

      <div className="absolute right-2 bottom-2 z-10 flex items-center gap-2 rounded-full bg-ember px-4 py-2 text-sm font-medium text-[#2a1703] shadow-[var(--shadow-lift)]">
        <SparklesIcon className="size-4" />
        Outside your bubble
      </div>
    </div>
  );
}
