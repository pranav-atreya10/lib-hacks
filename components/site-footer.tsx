import Link from "next/link";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="page-shell flex flex-col gap-3 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          {site.name} — anyone with the link can read it. No sign-in, no
          tracking.
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
