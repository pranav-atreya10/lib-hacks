"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderIcon, UsersIcon } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { site } from "@/lib/site";
import { ThemeToggle } from "@/components/theme-toggle";
import { PersonaPicker } from "@/components/persona-picker";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="page-shell flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 text-foreground"
            aria-label={`${site.name} home`}
          >
            <BrandMark />
            <span className="hidden font-display text-[1.375rem] leading-none sm:inline">
              {site.name}
            </span>
          </Link>
          <span className="rounded-full bg-ember-soft px-2 py-0.5 text-xs font-medium text-ember-ink">
            Demo
          </span>
        </div>

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
                  aria-label={item.label}
                  className={cn(
                    "press flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium sm:px-3",
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {item.href === "/people" ? (
                    <UsersIcon
                      aria-hidden="true"
                      className={cn("size-3.5", active ? "text-brand" : "opacity-60")}
                    />
                  ) : (
                    <FolderIcon
                      aria-hidden="true"
                      className={cn("size-3.5", active ? "text-brand" : "opacity-60")}
                    />
                  )}
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          {pathname !== "/" ? (
            <>
              <span
                aria-hidden="true"
                className="mx-1.5 hidden h-5 w-px bg-border sm:block"
              />
              <PersonaPicker />
            </>
          ) : null}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
