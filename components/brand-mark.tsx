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
      <defs>
        <linearGradient id="brand-loop" x1="4" y1="16" x2="28" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5b9cf2" />
          <stop offset="0.5" stopColor="#5b9cf2" />
          <stop offset="0.5" stopColor="#eb9634" />
          <stop offset="1" stopColor="#eb9634" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="#17181c" />
      <path
        d="M16 16c-2.2-3.1-3.9-4.6-6-4.6a4.6 4.6 0 0 0 0 9.2c2.1 0 3.8-1.5 6-4.6s3.9-4.6 6-4.6a4.6 4.6 0 0 1 0 9.2c-2.1 0-3.8-1.5-6-4.6Z"
        fill="none"
        stroke="url(#brand-loop)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
