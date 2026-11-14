import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function NotFound() {
  return (
    <>
    <SiteHeader />
    <main id="main" className="page-shell flex min-h-[60vh] flex-1 flex-col items-start justify-center py-16">
      <p className="text-sm text-muted-foreground">404 · Not on the shelf</p>
      <h1 className="mt-2 max-w-xl text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
        This one isn&rsquo;t in the catalogue.
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        The page may have moved, or the link may be from an old shelf. The
        library is always a good place to restart.
      </p>
      <div className="mt-6 flex gap-2">
        <Button asChild>
          <Link href="/library">Open the library</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/offices">See the offices</Link>
        </Button>
      </div>
    </main>
    <SiteFooter />
    </>
  );
}
