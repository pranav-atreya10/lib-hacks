import { hash32 } from "@/lib/engagement";
import { cn } from "@/lib/utils";

const COLORS = ["#2f74d8", "#7c5cd6", "#0f9d8a", "#d06a2c", "#c2417a", "#4b7a3d", "#5b6b84"];

const SIZES = {
  xs: "size-5 text-[0.55rem]",
  sm: "size-7 text-[0.65rem]",
  md: "size-9 text-xs",
  lg: "size-14 text-base",
} as const;

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Initials on a colour picked from the person's id, so it never changes. */
export function UserAvatar({
  name,
  seed,
  size = "sm",
  className,
}: {
  name: string;
  seed: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("grid shrink-0 place-items-center rounded-full font-semibold text-white", SIZES[size], className)}
      style={{ backgroundColor: COLORS[hash32(seed) % COLORS.length] }}
    >
      {initialsOf(name) || "?"}
    </span>
  );
}
