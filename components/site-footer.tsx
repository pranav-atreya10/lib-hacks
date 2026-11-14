import Link from "next/link";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="page-shell flex flex-col gap-3 py-6 text-[0.8125rem] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-ember/50 bg-ember-soft px-1.5 py-0.5 text-[0.6rem] font-medium tracking-wide text-ember-ink uppercase">
            Demo
          </span>
          <span>
            {site.name} — sample content, not a real company library. Anyone
            with the link can read it. No sign-in, no tracking.
          </span>
        </p>
        <nav aria-label="Footer" className="flex items-center gap-4">
          {site.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
