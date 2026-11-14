import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="page-shell flex min-h-[60vh] flex-col items-start justify-center py-16">
      <p className="catalog-code">404 · not on the shelf</p>
      <h1 className="mt-3 max-w-xl text-4xl leading-[1.05] sm:text-5xl">
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
    </div>
  );
}
