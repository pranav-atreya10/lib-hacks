import { Suspense } from "react";
import { AppSidebar, AppTopBar } from "@/components/app-sidebar";

/**
 * The signed-in app. The rail and the page each read the session, so each
 * streams in behind its own boundary while the frame paints straight away.
 */
export default function AppLayout({ children }: LayoutProps<"/app">) {
  return (
    <div className="flex min-h-dvh flex-1">
      <Suspense fallback={<div className="hidden w-64 shrink-0 border-r border-border bg-sidebar lg:block" />}>
        <AppSidebar />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col">
        <Suspense fallback={<div className="h-14 border-b border-border lg:hidden" />}>
          <AppTopBar />
        </Suspense>
        <main id="main" className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
