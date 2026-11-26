import Link from "next/link";
import {
  ArrowRightIcon,
  BooksIcon,
  CheckIcon,
  CompassIcon,
  LayersIcon,
  SparklesIcon,
  TrendingUpIcon,
  UsersIcon,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { HeroArt } from "@/components/hero-art";
import { HeroHeadline } from "@/components/hero-headline";
import { COLLECTIONS } from "@/lib/marketplace";
import { CATALOG } from "@/lib/catalog";

const FEATURES = [
  {
    icon: LayersIcon,
    title: "Libraries for every team",
    body: `Anyone can start a library for their team, practice or office — like a group chat for reading. Stock it from ${COLLECTIONS.length} marketplace collections of ${CATALOG.length} real books, talks, podcasts and articles.`,
    span: "lg:col-span-2",
  },
  {
    icon: UsersIcon,
    title: "Overlapping by design",
    body: "People join as many libraries as they like — their team, the India office, the AI reading group.",
    span: "",
  },
  {
    icon: TrendingUpIcon,
    title: "Trends",
    body: "See what your company is reading, which topics are rising, and where nobody is looking.",
    span: "",
  },
  {
    icon: CompassIcon,
    title: "A ranking for every person",
    body: "Interests picked at onboarding, plus what colleagues like, review and open — and picks from outside their bubble.",
    span: "lg:col-span-2",
  },
];

const LEAD_POINTS = [
  "Per-person and team insights: reads, likes, reviews, top topics, blind spots",
  "Coaching prompts, notes and assigned reads that complete themselves",
  "A monthly giveaway — you pick the winner",
  "Everyone can see exactly what their lead sees about them",
];

export default function HomePage() {
  return (
    <>
      <section className="page-shell flex min-h-[calc(100dvh-4rem)] flex-col justify-center py-16 sm:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-14 xl:grid-cols-[minmax(0,1fr)_500px] xl:gap-20">
          <div>
            <HeroHeadline />
            <p className="mt-8 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              The learning library for your company. Topic libraries, reading clubs and trends
              for everyone — and insights that help team leads coach their people.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="h-11 gap-2 px-6 text-[0.9375rem]">
                <Link href="/sign-up">
                  Get started free
                  <ArrowRightIcon className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              Free for every team. No credit card, no limits.
            </p>
          </div>
          <HeroArt />
        </div>
      </section>

      <section id="product" className="border-t border-border bg-sidebar py-24">
        <div className="page-shell">
          <h2 className="max-w-2xl font-display text-[2.25rem] leading-tight">
            A library your company actually uses
          </h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Admins create the workspace and invite people. Everyone picks what they&rsquo;re into,
            and the library ranks itself for them.
          </p>
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body, span }) => (
              <div key={title} className={`surface p-8 ${span}`}>
                <span className="grid size-10 place-items-center rounded-lg bg-muted">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-6 text-lg font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="insights" className="py-24">
        <div className="page-shell grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-[2.25rem] leading-tight">Built for team leads</h2>
            <p className="mt-3 max-w-md text-muted-foreground">
              Know what your team is learning, coach with specifics, and recognise the people who
              keep the library alive.
            </p>
            <ul className="mt-8 grid gap-3">
              {LEAD_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm">
                  <CheckIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div className="surface overflow-hidden" aria-hidden="true">
            <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
            </div>
            <div className="grid gap-5 p-6">
              <p className="text-sm font-semibold">Team insights · last 30 days</p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  ["Reads", "184"],
                  ["Reviews", "37"],
                  ["Active", "11 of 12"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-2">
                {[
                  ["Leadership", 82],
                  ["Engineering & AI", 64],
                  ["Communication", 41],
                  ["Security", 6],
                ].map(([label, value]) => (
                  <div key={label as string} className="grid grid-cols-[8rem_1fr] items-center gap-3 text-xs">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="h-2 rounded-full bg-muted">
                      <span className="block h-full rounded-full bg-foreground/80" style={{ width: `${value}%` }} />
                    </span>
                  </div>
                ))}
              </div>
              <p className="flex items-start gap-2 rounded-lg bg-tint-yellow px-3 py-2.5 text-xs text-tint-yellow-ink">
                <SparklesIcon className="mt-0.5 size-3.5 shrink-0" />
                Nobody has opened anything on Security this month. Assign a short read?
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-sidebar py-20">
        <div className="page-shell flex flex-wrap items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-[1.75rem] leading-tight">Start your company&rsquo;s library</h2>
            <p className="mt-2 text-muted-foreground">Create a workspace in a minute. It&rsquo;s free.</p>
          </div>
          <div className="flex gap-3">
            <Button asChild size="lg">
              <Link href="/sign-up">
                <BooksIcon className="size-4" aria-hidden="true" />
                Create a workspace
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
