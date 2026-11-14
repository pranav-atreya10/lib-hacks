import { cn } from "@/lib/utils";

/**
 * The Infinite Library mark: an infinity loop in the two brand colours —
 * blue for what you already like, amber for what you'd never have picked.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("size-8 shrink-0", className)}
    >
      <rect width="32" height="32" rx="9" fill="#17181c" />
      <path
        d="M16 16c-2.2-3.1-3.9-4.6-6-4.6a4.6 4.6 0 0 0 0 9.2c2.1 0 3.8-1.5 6-4.6"
        fill="none"
        stroke="#5b9cf2"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M16 16c2.2-3.1 3.9-4.6 6-4.6a4.6 4.6 0 0 1 0 9.2c-2.1 0-3.8-1.5-6-4.6"
        fill="none"
        stroke="#eb9634"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
