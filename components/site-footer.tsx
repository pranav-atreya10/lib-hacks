import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { site } from "@/lib/site";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/#product", label: "Libraries & clubs" },
      { href: "/#insights", label: "Team insights" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/sign-in", label: "Sign in" },
      { href: "/sign-up", label: "Create a workspace" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="page-shell grid gap-10 py-12 sm:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark className="size-7" />
            <span className="font-semibold tracking-tight">{site.name}</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">{site.purpose}</p>
        </div>
        {COLUMNS.map((column) => (
          <div key={column.title}>
            <p className="text-sm font-medium">{column.title}</p>
            <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="page-shell border-t border-border py-5 text-xs text-muted-foreground">
        © {site.name}. Activity in a workspace is visible to its admins
        and team leads, and to the person it belongs to.
      </div>
    </footer>
  );
}
