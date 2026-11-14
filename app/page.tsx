import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
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
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_400px] xl:gap-14">
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
              className="h-12 gap-2.5 rounded-full px-7 text-[0.9375rem] font-semibold"
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
