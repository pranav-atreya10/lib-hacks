import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { NavLink } from "@/components/nav-link";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserAvatar } from "@/components/user-avatar";
import {
  BooksIcon,
  BuildingsIcon,
  CompassIcon,
  LayersIcon,
  TrendingUpIcon,
  UsersIcon,
} from "@/components/icons";
import { signOut } from "@/app/actions";
import { requireMember } from "@/lib/auth";
import { companyLibraries } from "@/lib/library";

const NAV = [
  { href: "/app", label: "Home", icon: CompassIcon, exact: true },
  { href: "/app/libraries", label: "Libraries", icon: BooksIcon, exact: false },
  { href: "/app/trends", label: "Trends", icon: TrendingUpIcon, exact: false },
  { href: "/app/marketplace", label: "Marketplace", icon: LayersIcon, exact: false },
];

async function loadShell() {
  const viewer = await requireMember();
  const libraries = (await companyLibraries(viewer.membership.companyId, viewer.id)).filter(
    (library) => library.myRole,
  );
  return { viewer, libraries };
}

/** The app's left rail. Reads the session, so it streams in behind Suspense. */
export async function AppSidebar() {
  const { viewer, libraries } = await loadShell();
  const leading = libraries.filter((library) => library.myRole === "admin");
  const isAdmin = viewer.membership.role === "admin";

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col overflow-y-auto border-r border-border bg-sidebar lg:flex">
      <div className="flex h-14 items-center gap-2.5 px-4">
        <BrandMark className="size-7" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">{viewer.membership.companyName}</p>
          <p className="text-[0.6875rem] text-muted-foreground">
            Free workspace
          </p>
        </div>
      </div>

      <nav aria-label="App" className="mt-2 grid gap-0.5 px-3">
        {NAV.map(({ href, label, icon: Icon, exact }) => (
          <NavLink key={href} href={href} exact={exact}>
            <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
        {isAdmin ? (
          <NavLink href="/app/admin">
            <BuildingsIcon className="size-4 text-muted-foreground" aria-hidden="true" />
            Company admin
          </NavLink>
        ) : null}
      </nav>

      <div className="mt-6 px-3">
        <p className="px-2.5 text-xs text-muted-foreground">Your libraries</p>
        <ul className="mt-1.5 grid gap-0.5">
          {libraries.map((library) => (
            <li key={library.id}>
              <NavLink href={`/app/libraries/${library.id}`}>
                <span className="grid size-5 shrink-0 place-items-center rounded bg-muted text-[0.625rem] font-semibold text-muted-foreground">
                  {library.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="truncate">{library.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      {leading.length > 0 ? (
        <div className="mt-6 px-3">
          <p className="px-2.5 text-xs text-muted-foreground">You lead</p>
          <ul className="mt-1.5 grid gap-0.5">
            {leading.map((library) => (
              <li key={library.id}>
                <NavLink href={`/app/libraries/${library.id}/insights`}>
                  <UsersIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                  <span className="truncate">{library.name} insights</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-auto border-t border-border p-3">
        <div className="flex items-center gap-2.5 px-1">
          <Link href="/app/me" className="flex min-w-0 flex-1 items-center gap-2.5 rounded-[6px] p-1 hover:bg-muted">
            <UserAvatar name={viewer.name} seed={viewer.id} size="sm" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{viewer.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {viewer.membership.title || (isAdmin ? "Company admin" : "Member")}
              </span>
            </span>
          </Link>
          <ThemeToggle compact />
        </div>
        <form action={signOut}>
          <button type="submit" className="mt-1 w-full rounded-[6px] px-2.5 py-2 text-left text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}

/** Below the large breakpoint: a slim top bar with the same destinations. */
export async function AppTopBar() {
  const { viewer } = await loadShell();
  const links = [...NAV, { href: "/app/me", label: "Me", icon: UsersIcon, exact: false }];
  if (viewer.membership.role === "admin") links.push({ href: "/app/admin", label: "Admin", icon: BuildingsIcon, exact: false });
  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md lg:hidden">
      <div className="flex h-14 items-center gap-2.5 px-4">
        <BrandMark className="size-7" />
        <span className="truncate text-sm font-semibold">{viewer.membership.companyName}</span>
        <span className="ml-auto">
          <ThemeToggle compact />
        </span>
      </div>
      <nav aria-label="App" className="flex gap-1 overflow-x-auto px-3 pb-2">
        {links.map(({ href, label, exact }) => (
          <NavLink key={href} href={href} exact={exact} className="h-8 shrink-0 px-3">
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
