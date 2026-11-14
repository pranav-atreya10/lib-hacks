"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLibraryState } from "@/components/library-state";
import { PersonaAvatar } from "@/components/persona-avatar";
import { RecommendDialog } from "@/components/recommend-dialog";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  BooksIcon,
  BuildingsIcon,
  CheckIcon,
  ChevronsUpDownIcon,
  CompassIcon,
  PlusIcon,
  UsersIcon,
} from "@/components/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PERSONAS, type Persona } from "@/lib/personas";
import { officeBySlug } from "@/lib/offices";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/library", label: "Library", icon: BooksIcon },
  { href: "/people", label: "People", icon: UsersIcon },
  { href: "/offices", label: "Offices", icon: BuildingsIcon },
] as const;

const SEASON_START = "2026-09-01";

/** The app's left rail: who's reading, what they can do, where to go. */
export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { persona, allResources } = useLibraryState();
  const fresh = allResources.filter((resource) => resource.addedAt >= SEASON_START).length;
  const share = Math.round((fresh / Math.max(1, allResources.length)) * 100);
  // On an office page, recommending is only allowed if it's the reader's office.
  const viewingOffice = pathname.match(/^\/offices\/([^/]+)/)?.[1];

  function startTour() {
    if (pathname === "/library") window.dispatchEvent(new Event("infinite-library:start-tour"));
    else router.push("/library?tour=1");
  }

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
      <div className="flex h-14 items-center gap-2.5 px-4">
        <Link href="/" className="flex items-center gap-2.5" aria-label={`${site.name} home`}>
          <BrandMark className="size-7" />
          <span className="text-[0.9375rem] font-semibold tracking-tight">{site.name}</span>
        </Link>
      </div>

      <div className="grid gap-2 px-3">
        <ReaderSwitcher />
        {persona ? (
          <RecommendDialog targetOffice={viewingOffice}>
            <button
              type="button"
              className="press flex h-9 items-center justify-center gap-2 rounded-[6px] bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/85"
            >
              <PlusIcon className="size-4" aria-hidden="true" />
              Recommend
            </button>
          </RecommendDialog>
        ) : (
          <button
            type="button"
            onClick={startTour}
            className="press flex h-9 items-center justify-center gap-2 rounded-[6px] border border-border bg-card text-sm font-medium hover:bg-muted"
          >
            <CompassIcon className="size-4" aria-hidden="true" />
            Take the tour
          </button>
        )}
      </div>

      <nav aria-label="Main" className="mt-4 grid gap-0.5 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-9 items-center gap-2.5 rounded-[6px] px-2.5 text-sm",
                active
                  ? "bg-card font-medium text-foreground shadow-[0_0_0_1px_var(--border)]"
                  : "text-foreground/75 hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 px-3">
        <p className="px-2.5 text-xs text-muted-foreground">Our offices</p>
        <ul className="mt-1.5 grid gap-0.5">
          {PERSONAS.map((person) => {
            const office = officeBySlug.get(person.office);
            if (!office) return null;
            const href = `/offices/${office.slug}`;
            const active = pathname === href;
            return (
              <li key={person.id}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-9 items-center gap-2.5 rounded-[6px] px-2.5 text-sm",
                    active
                      ? "bg-card font-medium shadow-[0_0_0_1px_var(--border)]"
                      : "text-foreground/75 hover:bg-muted hover:text-foreground",
                  )}
                >
                  <PersonaAvatar persona={person} size="xs" />
                  <span className="truncate">{office.city}</span>
                  {persona?.id === person.id ? (
                    <span className="ml-auto text-xs text-muted-foreground">Yours</span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
        {persona ? (
          <button
            type="button"
            onClick={startTour}
            className="mt-1 flex h-9 w-full items-center gap-2.5 rounded-[6px] px-2.5 text-sm text-foreground/75 hover:bg-muted hover:text-foreground"
          >
            <CompassIcon className="size-4 text-muted-foreground" aria-hidden="true" />
            Take the tour
          </button>
        ) : null}
      </div>

      <div className="mt-auto grid gap-4 border-t border-border p-4">
        <div>
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-medium">New since September</span>
            <span className="text-muted-foreground tabular-nums">
              {fresh} of {allResources.length}
            </span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-border">
            <div className="h-full rounded-full bg-brand" style={{ width: `${share}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <PersonaAvatar persona={persona} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{persona?.name ?? "Visitor"}</p>
            <p className="truncate text-xs text-muted-foreground">
              {persona ? officeBySlug.get(persona.office)?.city : "View only"}
            </p>
          </div>
          <ThemeToggle compact />
        </div>
      </div>
    </aside>
  );
}

/** The workspace-style switcher at the top of the rail. */
function ReaderSwitcher() {
  const { persona, personaId, setPersonaId } = useLibraryState();
  const options: (Persona | null)[] = [null, ...PERSONAS];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-11 w-full items-center gap-2.5 rounded-[6px] px-2 text-left hover:bg-muted aria-expanded:bg-muted"
          aria-label={`Reading as ${persona?.name ?? "Visitor"}. Change person`}
        >
          <PersonaAvatar persona={persona} size="sm" />
          <span className="min-w-0 flex-1">
            <span className="block text-[0.6875rem] text-muted-foreground">Reading as</span>
            <span className="block truncate text-sm font-medium">{persona?.name ?? "Visitor"}</span>
          </span>
          <ChevronsUpDownIcon className="size-4 text-muted-foreground" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60 rounded-lg p-1">
        <DropdownMenuLabel className="px-2 text-xs font-normal text-muted-foreground">
          Who&rsquo;s reading?
        </DropdownMenuLabel>
        {options.map((option) => {
          const id = option?.id ?? null;
          return (
            <DropdownMenuItem
              key={id ?? "visitor"}
              onSelect={() => setPersonaId(id)}
              className="flex cursor-pointer items-center gap-2.5 rounded-[6px] px-2 py-2"
            >
              <PersonaAvatar persona={option} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{option?.name ?? "Visitor"}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {option ? officeBySlug.get(option.office)?.city : "View only"}
                </span>
              </span>
              {id === personaId ? <CheckIcon className="size-4" aria-hidden="true" /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
