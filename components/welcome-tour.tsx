"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DONE_KEY = "infinite-library:welcome-done";

interface Step {
  /** A CSS selector to spotlight, or none for a centered card. */
  target?: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    title: "You're all set",
    body: "Here's a 20-second tour of where things are. Use the arrow keys or the buttons.",
  },
  {
    target: '[data-tour="home"]',
    title: "Home",
    body: "What's new this week and a ranking made for you — your interests first, then what colleagues like.",
  },
  {
    target: '[data-tour="libraries"]',
    title: "Libraries",
    body: "Shelves for a team, an office or a topic. Join as many as you like, or start your own.",
  },
  {
    target: '[data-tour="recommend"]',
    title: "Recommend anything",
    body: "Paste a link — a book, video, podcast or article. The cover and title fill themselves in.",
  },
  {
    target: '[data-tour="trends"]',
    title: "Trends",
    body: "See what the whole company is reading, which topics are rising, and what nobody has opened.",
  },
];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8;

/** A one-time spotlight tour, started by ?welcome=1 after onboarding. */
export function WelcomeTour() {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({ width: 1280, height: 800 });
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = useState(180);

  const step = STEPS[Math.min(index, STEPS.length - 1)];

  const finish = useCallback(() => {
    setActive(false);
    try {
      window.localStorage.setItem(DONE_KEY, "1");
    } catch {}
    const url = new URL(window.location.href);
    if (url.searchParams.has("welcome")) {
      url.searchParams.delete("welcome");
      router.replace(url.pathname + (url.search ? url.search : ""));
    }
  }, [router]);

  // Start only on /app, only when asked, and only once.
  useEffect(() => {
    if (pathname !== "/app" || params.get("welcome") !== "1") return;
    let done = false;
    try {
      done = window.localStorage.getItem(DONE_KEY) === "1";
    } catch {}
    if (!done) {
      const timer = window.setTimeout(() => setActive(true), 400);
      return () => window.clearTimeout(timer);
    }
  }, [pathname, params]);

  // Measure the current target, and keep the spotlight on it.
  useLayoutEffect(() => {
    if (!active) return;
    const measure = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
      const element = step.target ? document.querySelector<HTMLElement>(step.target) : null;
      if (!element) {
        setRect(null);
        return;
      }
      const box = element.getBoundingClientRect();
      setRect({ top: box.top, left: box.left, width: box.width, height: box.height });
    };
    const frame = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [active, step.target, index]);

  useLayoutEffect(() => {
    if (active && cardRef.current) setCardHeight(cardRef.current.getBoundingClientRect().height);
  }, [active, index]);

  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
      else if (event.key === "ArrowRight") setIndex((value) => Math.min(STEPS.length - 1, value + 1));
      else if (event.key === "ArrowLeft") setIndex((value) => Math.max(0, value - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, finish]);

  if (!active) return null;

  const width = Math.min(360, viewport.width - 32);
  const margin = 16;
  let cardStyle: React.CSSProperties;
  if (rect) {
    const left = Math.min(Math.max(margin, rect.left), viewport.width - width - margin);
    const below = rect.top + rect.height + PAD + margin;
    cardStyle =
      below + cardHeight < viewport.height
        ? { top: below, left }
        : { top: Math.max(margin, rect.top - PAD - margin - cardHeight), left };
  } else {
    cardStyle = { top: (viewport.height - cardHeight) / 2, left: (viewport.width - width) / 2 };
  }

  const hole = rect
    ? {
        top: Math.max(4, rect.top - PAD),
        left: Math.max(4, rect.left - PAD),
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
      }
    : null;
  const last = index === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed rounded-xl transition-[top,left,width,height] duration-300 ease-(--ease-out)"
        style={
          hole
            ? { ...hole, boxShadow: "0 0 0 200vmax rgb(10 10 14 / 0.55)" }
            : { top: "50%", left: "50%", width: 0, height: 0, boxShadow: "0 0 0 200vmax rgb(10 10 14 / 0.55)" }
        }
      />
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label={step.title}
        className="rise-in fixed rounded-xl border border-border bg-popover p-5 shadow-2xl"
        style={{ ...cardStyle, width }}
      >
        <p className="text-xs text-muted-foreground tabular-nums">
          {index + 1} of {STEPS.length}
        </p>
        <h2 className="mt-1.5 text-base font-semibold tracking-tight">{step.title}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
        <div className="mt-4 flex items-center gap-2">
          <div className="mr-auto flex gap-1" aria-hidden="true">
            {STEPS.map((_, dot) => (
              <span
                key={dot}
                className={cn(
                  "h-1.5 rounded-full transition-[width] duration-300 ease-(--ease-out)",
                  dot === index ? "w-4 bg-foreground" : "w-1.5 bg-border",
                )}
              />
            ))}
          </div>
          {index === 0 ? (
            <Button variant="ghost" size="sm" onClick={finish}>
              Skip
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setIndex(index - 1)}>
              Back
            </Button>
          )}
          <Button size="sm" onClick={() => (last ? finish() : setIndex(index + 1))}>
            {last ? "Done" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
