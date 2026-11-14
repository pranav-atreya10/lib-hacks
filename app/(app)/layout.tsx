import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";

/**
 * The app: a fixed sidebar on the left, the page on the right. Below the
 * large breakpoint the sidebar folds into the regular top bar.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-1">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="lg:hidden">
          <SiteHeader />
        </div>
        <main id="main" className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
