"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { BooksIcon, CompassIcon, SparklesIcon, UsersIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const KEY = "infinite-library:intro-seen";
const EVENT = "infinite-library:intro";

const SLIDES = [
  {
    icon: SparklesIcon,
    title: "Welcome to Infinite Library",
    body: "Inspire. Engage. Innovate. A shared library of books, talks, podcasts and articles for your whole company.",
  },
  {
    icon: BooksIcon,
    title: "Libraries for every team",
    body: "Anyone can start a library — for a team, an office or a topic — and you can be in as many as you like.",
  },
  {
    icon: CompassIcon,
    title: "Ranked for you, and beyond you",
    body: "Your interests come first, then what colleagues like and review. Some picks are outside your bubble on purpose.",
  },
  {
    icon: UsersIcon,
    title: "Leads coach with real insight",
    body: "Library admins see what their team reads and can assign reads and leave notes. You always see exactly what they see.",
  },
];

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}
function seen() {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return true;
  }
}

/** Four welcome slides before setup, shown once. Then the children. */
export function IntroSlides({ children }: { children: React.ReactNode }) {
  const done = useSyncExternalStore(subscribe, seen, () => true);
  const [index, setIndex] = useState(0);

  function finish() {
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {}
    window.dispatchEvent(new Event(EVENT));
  }

  useEffect(() => {
    if (done) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") setIndex((value) => Math.min(SLIDES.length - 1, value + 1));
      if (event.key === "ArrowLeft") setIndex((value) => Math.max(0, value - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [done]);

  if (done) return <>{children}</>;
  const slide = SLIDES[index];
  const Icon = slide.icon;
  const last = index === SLIDES.length - 1;

  return (
    <section aria-roledescription="carousel" aria-label="Welcome" className="surface w-full max-w-lg overflow-hidden">
      <div className="grid h-52 place-items-center bg-sidebar">
        <span key={index} className="rise-in grid size-20 place-items-center rounded-2xl bg-foreground text-background">
          <Icon className="size-9" aria-hidden="true" />
        </span>
      </div>
      <div key={index} className="rise-in grid gap-3 p-8">
        <p className="text-xs text-muted-foreground tabular-nums">
          {index + 1} of {SLIDES.length}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{slide.title}</h1>
        <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">{slide.body}</p>
      </div>
      <div className="flex items-center gap-3 border-t border-border px-8 py-5">
        <div className="mr-auto flex gap-1.5" aria-hidden="true">
          {SLIDES.map((_, dot) => (
            <span
              key={dot}
              className={cn(
                "h-1.5 rounded-full transition-[width,background-color] duration-300 ease-(--ease-out)",
                dot === index ? "w-5 bg-foreground" : "w-1.5 bg-border",
              )}
            />
          ))}
        </div>
        {last ? null : (
          <Button variant="ghost" onClick={finish}>
            Skip
          </Button>
        )}
        <Button onClick={() => (last ? finish() : setIndex(index + 1))}>{last ? "Get set up" : "Next"}</Button>
      </div>
    </section>
  );
}
