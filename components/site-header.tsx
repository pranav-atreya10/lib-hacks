import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { site } from "@/lib/site";

/** Marketing header: product links on the left, sign-in on the right. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="page-shell flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label={`${site.name} home`}>
            <BrandMark className="size-7" />
            <span className="text-[0.9375rem] font-semibold tracking-tight">{site.name}</span>
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {site.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[6px] px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-1.5">
          <ThemeToggle compact />
          <Link
            href="/sign-in"
            className="hidden rounded-[6px] px-3 py-2 text-sm font-medium hover:bg-muted sm:block"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="press rounded-[6px] bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/85"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
