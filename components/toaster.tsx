"use client";

import { Toaster as Sonner } from "sonner";
import { useTheme } from "next-themes";

/** App-wide notifications, styled to match the white-panel look. */
export function Toaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "!rounded-lg !border !border-border !bg-popover !text-popover-foreground !shadow-[0_8px_24px_rgb(0_0_0/0.08)] !font-sans",
          title: "!text-sm !font-semibold",
          description: "!text-sm !text-muted-foreground",
          actionButton: "!rounded-[6px] !bg-primary !text-primary-foreground !text-xs !font-medium",
        },
      }}
    />
  );
}
