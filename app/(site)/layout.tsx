import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

/** The landing page: a plain top bar and footer, no app chrome. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
