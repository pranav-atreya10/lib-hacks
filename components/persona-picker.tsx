"use client";

import Link from "next/link";
import { CheckIcon, ChevronDownIcon, UsersIcon } from "lucide-react";
import { useLibraryState } from "@/components/library-state";
import { PERSONAS, initials } from "@/lib/personas";
import { officeBySlug } from "@/lib/offices";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function PersonaPicker() {
  const { persona, personaId, setPersonaId } = useLibraryState();
  const office = officeBySlug.get(persona.office);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md border border-border px-1.5 py-1 text-left transition-colors hover:bg-muted aria-expanded:bg-muted"
          aria-label={`Viewing as ${persona.name}. Change person`}
        >
          <span
            className="grid size-6 shrink-0 place-items-center rounded-full text-[0.6rem] font-semibold text-white"
            style={{ backgroundColor: persona.accent }}
            aria-hidden="true"
          >
            {initials(persona.name)}
          </span>
          <span className="hidden max-w-24 truncate text-xs sm:block">
            {persona.name.split(" ")[0]}
          </span>
          <ChevronDownIcon className="size-3 text-muted-foreground" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">
          Viewing as {office ? `· ${office.city}` : ""}
        </DropdownMenuLabel>
        {PERSONAS.map((option) => {
          const optionOffice = officeBySlug.get(option.office);
          const active = option.id === personaId;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setPersonaId(option.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted",
                active && "bg-muted",
              )}
            >
              <span
                className="grid size-6 shrink-0 place-items-center rounded-full text-[0.6rem] font-semibold text-white"
                style={{ backgroundColor: option.accent }}
                aria-hidden="true"
              >
                {initials(option.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.8125rem]">{option.name}</span>
                <span className="block truncate text-[0.7rem] text-muted-foreground">
                  {optionOffice?.city} · {option.traits[0]}
                </span>
              </span>
              {active ? (
                <CheckIcon className="size-3.5 text-brand" aria-hidden="true" />
              ) : null}
            </button>
          );
        })}
        <DropdownMenuSeparator />
        <Link
          href="/people"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[0.8125rem] text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <UsersIcon className="size-3.5" aria-hidden="true" />
          See everyone&rsquo;s shelves
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
