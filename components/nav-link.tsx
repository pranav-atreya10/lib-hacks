"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** A sidebar link that knows when it's the current page. */
export function NavLink({
  href,
  exact = false,
  children,
  className,
}: {
  href: string;
  exact?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-9 items-center gap-2.5 rounded-[6px] px-2.5 text-sm",
        active
          ? "bg-card font-medium text-foreground shadow-[0_0_0_1px_var(--border)]"
          : "text-foreground/75 hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      {children}
    </Link>
  );
}
