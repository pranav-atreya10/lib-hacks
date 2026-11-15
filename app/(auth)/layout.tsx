import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { site } from "@/lib/site";

/** Sign-in, sign-up and onboarding: one calm column, no app chrome. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col bg-sidebar">
      <header className="flex h-16 items-center px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark className="size-7" />
          <span className="font-semibold tracking-tight">{site.name}</span>
        </Link>
      </header>
      <main id="main" className="flex flex-1 items-start justify-center px-5 pt-6 pb-16 sm:pt-12">
        {children}
      </main>
    </div>
  );
}
