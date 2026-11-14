import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { HeroArt } from "@/components/hero-art";
import { HeroHeadline } from "@/components/hero-headline";
import { TourButton } from "@/components/tour";
import { RESOURCES } from "@/lib/content";

/**
 * Display only. The library itself lives behind the call to action, so this
 * page stays a poster rather than a second copy of the app.
 */
export default function HomePage() {
  return (
    <section className="page-shell flex min-h-[calc(100dvh-9.5rem)] flex-col justify-center py-16 sm:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-14 xl:grid-cols-[minmax(0,1fr)_500px] xl:gap-20">
        <div>
          <HeroHeadline />

          <p className="mt-8 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Books, podcasts, talks and articles filed by 74 offices — one library,
            and a different ranking for every person who opens it.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="lg"
              className="h-11 gap-2 px-6 text-[0.9375rem] font-medium"
            >
              <Link href="/library">
                Judges, click here for the app
                <ArrowRightIcon className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <TourButton className="h-12 px-6" />
          </div>

          <p className="mt-5 text-sm text-muted-foreground">
            Opens the library itself — {RESOURCES.length} files, no sign-in, no tracking.
          </p>
        </div>

        <HeroArt />
      </div>
    </section>
  );
}
