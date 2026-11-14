"use client";

import Link from "next/link";
import { CheckIcon, ChevronDownIcon, UsersIcon } from "lucide-react";
import { useLibraryState } from "@/components/library-state";
import { PersonaAvatar } from "@/components/persona-avatar";
import { PERSONAS, type Persona } from "@/lib/personas";
import { officeBySlug } from "@/lib/offices";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function PersonaPicker() {
  const { persona, personaId, setPersonaId } = useLibraryState();
  const options: (Persona | null)[] = [null, ...PERSONAS];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="press flex items-center gap-2 rounded-full border border-border bg-card py-1 pr-2.5 pl-1 text-left hover:bg-muted aria-expanded:bg-muted"
          aria-label={`Viewing as ${persona?.name ?? "Visitor"}. Change person`}
        >
          <PersonaAvatar persona={persona} size="sm" />
          <span className="hidden max-w-24 truncate text-sm font-medium sm:block">
            {persona ? persona.name.split(" ")[0] : "Visitor"}
          </span>
          <ChevronDownIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72 rounded-xl p-1.5">
        <DropdownMenuLabel className="px-2 text-xs font-normal text-muted-foreground">
          Who&rsquo;s reading?
        </DropdownMenuLabel>
        {options.map((option) => {
          const id = option?.id ?? null;
          const active = id === personaId;
          const office = option ? officeBySlug.get(option.office) : null;
          return (
            <DropdownMenuItem
              key={id ?? "visitor"}
              onSelect={() => setPersonaId(id)}
              className={cn(
                "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-left",
                active && "bg-muted",
              )}
            >
              <PersonaAvatar persona={option} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {option ? option.name : "Visitor"}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {option ? `${office?.city} · ${option.traits.join(", ")}` : "View only"}
                </span>
              </span>
              {active ? <CheckIcon className="size-4 text-foreground" aria-hidden="true" /> : null}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-2 py-2 text-sm text-muted-foreground">
          <Link href="/people">
            <UsersIcon className="size-4" aria-hidden="true" />
            See everyone&rsquo;s shelves
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
