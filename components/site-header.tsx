"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderIcon, UsersIcon } from "lucide-react";
import { site } from "@/lib/site";
import { ThemeToggle } from "@/components/theme-toggle";
import { PersonaPicker } from "@/components/persona-picker";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="page-shell flex h-14 items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 text-foreground"
            aria-label={`${site.name} home`}
          >
            <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
              <FolderIcon className="size-4" aria-hidden="true" />
            </span>
            <span className="hidden text-[0.95rem] font-semibold tracking-tight sm:inline">
              {site.name}
            </span>
          </Link>
          <span className="rounded-full border border-ember/50 bg-ember-soft px-1.5 py-0.5 text-[0.6rem] font-medium tracking-wide text-ember-ink uppercase">
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
                    "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[0.8125rem] transition-colors sm:px-2.5",
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
                className="mx-1 hidden h-4 w-px bg-border sm:block"
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
