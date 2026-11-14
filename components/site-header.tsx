"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { site } from "@/lib/site";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="page-shell flex h-14 items-center justify-between gap-6">
        <Link
          href="/"
          className="flex items-baseline gap-2 text-foreground"
          aria-label={`${site.name} home`}
        >
          <span className="font-heading text-lg leading-none tracking-tight">
            {site.name}
          </span>
          <span className="catalog-code hidden sm:inline">est. 2026</span>
        </Link>

        <div className="flex items-center gap-1">
          <nav aria-label="Main" className="flex items-center gap-1">
            {site.nav.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
