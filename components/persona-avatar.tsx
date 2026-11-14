import { EyeIcon } from "lucide-react";
import { initials, type Persona } from "@/lib/personas";
import { cn } from "@/lib/utils";

const SIZES = {
  xs: "size-5 text-[0.55rem]",
  sm: "size-7 text-[0.65rem]",
  md: "size-9 text-xs",
  lg: "size-14 text-base",
} as const;

/** A person's initials on their colour; the visitor gets an eye. */
export function PersonaAvatar({
  persona,
  size = "sm",
  className,
}: {
  persona: Persona | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-semibold",
        persona ? "text-white" : "bg-muted text-muted-foreground ring-1 ring-border ring-inset",
        SIZES[size],
        className,
      )}
      style={persona ? { backgroundColor: persona.accent } : undefined}
    >
      {persona ? initials(persona.name) : <EyeIcon className="size-[45%]" />}
    </span>
  );
}
