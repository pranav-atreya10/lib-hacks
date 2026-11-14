"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CompassIcon } from "lucide-react";
import { useLibraryState } from "@/components/library-state";
import { Button } from "@/components/ui/button";
import { getPersona } from "@/lib/personas";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

const DONE_KEY = "infinite-library:tour-done";
const START_EVENT = "infinite-library:start-tour";
const DEMO_PERSONA = "maya-chen";

interface Step {
  /** data-tour value to spotlight; none means a centred card. */
  target?: string;
  title: string;
  body: React.ReactNode;
  /** Only show this step when it applies (e.g. needs a person picked). */
  when?: (ctx: { hasPersona: boolean }) => boolean;
}

const STEPS: Step[] = [
  {
    target: "personas",
    title: "Pick who’s reading",
    body: (
      <>
        Each person gets their own ranking: Maya is a finance-and-crypto extrovert in New York,
        Jonah an introverted writer in Atlanta. <strong className="font-medium text-foreground">Visitor</strong>{" "}
        is view only. No sign-in — next, we&rsquo;ll read as Maya.
      </>
    ),
  },
  {
    target: "dashboard",
    title: "Ranked for her, by everyone",
    body: "Her interests and office come first, then everyone's likes, reviews and views. The dashboard tells her what's new.",
  },
  {
    target: "offices",
    title: "Office folders",
    body: "Every office keeps a shelf; our people's offices come first. In her own office Maya can recommend (paste a link — the cover fills itself in) and add tags.",
  },
  {
    target: "card",
    title: "Like, review, and get out of your bubble",
    body: "Tap the heart to upvote, or open a file for reviews. Each person's page also shows what people unlike them are reading — the opposite of a social feed.",
  },
];

/** Starts the tour on the library page, or takes you there to start it. */
export function TourButton({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <Button
      variant="outline"
      size="lg"
      className={cn("rounded-full bg-card", className)}
      onClick={() => {
        if (pathname === "/library") window.dispatchEvent(new Event(START_EVENT));
        else router.push("/library?tour=1");
      }}
    >
      <CompassIcon className="size-4" aria-hidden="true" />
      Take the tour
    </Button>
  );
}

interface Rect {
  /** Which step's target this measurement belongs to. */
  target: string;
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 10;

export function Tour() {
  const pathname = usePathname();
  const { persona, setPersonaId, hydrated } = useLibraryState();
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [measured, setRect] = useState<Rect | null>(null);
  const [cardSize, setCardSize] = useState({ width: 360, height: 240 });
  const [viewport, setViewport] = useState({ width: 1280, height: 800 });
  const cardRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const steps = STEPS.filter((step) => !step.when || step.when({ hasPersona: !!persona }));
  const step = steps[Math.min(index, steps.length - 1)];

  const start = useCallback(() => {
    setIndex(0);
    setActive(true);
  }, []);

  const finish = useCallback(() => {
    setActive(false);
    try {
      window.localStorage.setItem(DONE_KEY, "1");
    } catch {}
    const url = new URL(window.location.href);
    if (url.searchParams.has("tour")) {
      url.searchParams.delete("tour");
      window.history.replaceState(null, "", url.pathname + url.search);
    }
  }, []);

  // First visit to the library (or ?tour=1) starts the tour once.
  useEffect(() => {
    if (!hydrated || pathname !== "/library") return;
    const asked = new URLSearchParams(window.location.search).has("tour");
    let seen = false;
    try {
      seen = window.localStorage.getItem(DONE_KEY) === "1";
    } catch {}
    if (asked || !seen) {
      const timer = window.setTimeout(start, 450);
      return () => window.clearTimeout(timer);
    }
  }, [hydrated, pathname, start]);

  useEffect(() => {
    window.addEventListener(START_EVENT, start);
    return () => window.removeEventListener(START_EVENT, start);
  }, [start]);

  const go = useCallback(
    (delta: number) => {
      const current = steps[index];
      // Leaving the people step: read as Maya so liking, reviewing and
      // recommending are all live for the rest of the tour.
      if (delta > 0 && current?.target === "personas" && !persona) {
        setPersonaId(DEMO_PERSONA);
      }
      const next = index + delta;
      if (next >= steps.length) finish();
      else if (next >= 0) setIndex(next);
    },
    [finish, index, persona, setPersonaId, steps],
  );

  // Measure the target and keep the spotlight on it while the page moves.
  useLayoutEffect(() => {
    if (!active) return;
    const measureViewport = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    measureViewport();

    const target = step?.target;
    if (!target) return;
    const element = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
    if (!element) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const box = element.getBoundingClientRect();
    const tall = box.height > window.innerHeight * 0.6;
    const headerOffset = 88;
    const targetTop = tall
      ? window.scrollY + box.top - headerOffset
      : window.scrollY + box.top - (window.innerHeight - box.height) / 2 + 60;
    window.scrollTo({ top: Math.max(0, targetTop), behavior: reduce ? "auto" : "smooth" });

    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = element.getBoundingClientRect();
        setRect({ target, top: next.top, left: next.left, width: next.width, height: next.height });
        measureViewport();
      });
    };
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      observer.disconnect();
    };
  }, [active, step?.target, persona]);

  useLayoutEffect(() => {
    if (!active || !cardRef.current) return;
    const box = cardRef.current.getBoundingClientRect();
    setCardSize({ width: box.width, height: box.height });
  }, [active, index, measured?.height]);

  useEffect(() => {
    if (!active) return;
    nextRef.current?.focus({ preventScroll: true });
  }, [active, index]);

  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
      else if (event.key === "ArrowRight") go(1);
      else if (event.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, finish, go]);

  // The tour only lives on the library page.
  if (!active || !step || pathname !== "/library") return null;

  // A measurement left over from another step (or a missing target) is ignored.
  const rect = measured && measured.target === step.target ? measured : null;

  // Where the card goes: below the target, else above, else pinned low.
  const margin = 16;
  const width = Math.min(380, viewport.width - margin * 2);
  let cardStyle: React.CSSProperties;
  if (rect) {
    const below = viewport.height - (rect.top + rect.height + PAD);
    const above = rect.top - PAD;
    const left = Math.min(
      Math.max(margin, rect.left + rect.width / 2 - width / 2),
      viewport.width - width - margin,
    );
    if (below >= cardSize.height + margin * 2) {
      cardStyle = { top: rect.top + rect.height + PAD + margin, left, width };
    } else if (above >= cardSize.height + margin * 2 + 56) {
      cardStyle = { top: rect.top - PAD - margin - cardSize.height, left, width };
    } else {
      cardStyle = { bottom: margin * 1.5, left: (viewport.width - width) / 2, width };
    }
  } else {
    cardStyle = {
      top: Math.max(margin, (viewport.height - cardSize.height) / 2),
      left: (viewport.width - width) / 2,
      width,
    };
  }

  const hole = rect
    ? {
        top: Math.max(4, rect.top - PAD),
        left: Math.max(4, rect.left - PAD),
        width: Math.min(rect.width + PAD * 2, viewport.width - 8),
        height: Math.min(rect.height + PAD * 2, viewport.height - Math.max(4, rect.top - PAD) - 4),
      }
    : null;

  const titleId = `tour-title-${index}`;
  const demoPersona = getPersona(DEMO_PERSONA);

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Blocks clicks on the page while the tour is open. */}
      <div className="absolute inset-0" onClick={() => undefined} aria-hidden="true" />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed rounded-2xl transition-[top,left,width,height,opacity] duration-300 ease-(--ease-out)"
        style={
          hole
            ? { ...hole, boxShadow: "0 0 0 200vmax rgb(10 10 14 / 0.58)" }
            : {
                top: "50%",
                left: "50%",
                width: 0,
                height: 0,
                boxShadow: "0 0 0 200vmax rgb(10 10 14 / 0.58)",
              }
        }
      />

      <div
        ref={cardRef}
        key={index}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="rise-in fixed rounded-2xl border border-border bg-popover p-6 text-popover-foreground shadow-2xl"
        style={cardStyle}
      >
        <p className="text-xs text-muted-foreground tabular-nums">
          {index === 0 ? `${site.name} · ` : ""}
          {index + 1} of {steps.length}
        </p>
        <h2 id={titleId} className="mt-2 text-lg leading-snug font-semibold">
          {step.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>

        {index === steps.length - 1 && demoPersona ? (
          <Link
            href={`/people/${demoPersona.id}`}
            onClick={finish}
            className="mt-3 inline-block text-sm font-medium text-brand-ink hover:underline"
          >
            See {demoPersona.name.split(" ")[0]}&rsquo;s bubble →
          </Link>
        ) : null}

        <div className="mt-5 flex items-center gap-2">
          <div className="mr-auto flex gap-1" aria-hidden="true">
            {steps.map((_, dot) => (
              <span
                key={dot}
                className={cn(
                  "h-1.5 rounded-full transition-[width,background-color] duration-300 ease-(--ease-out)",
                  dot === index ? "w-4 bg-foreground" : "w-1.5 bg-border",
                )}
              />
            ))}
          </div>
          {index === 0 ? (
            <Button variant="ghost" size="sm" onClick={finish}>
              Skip tour
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => go(-1)}>
              Back
            </Button>
          )}
          <Button ref={nextRef} size="sm" onClick={() => go(1)}>
            {index === steps.length - 1 ? "Done" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
