"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Persona } from "@/lib/personas";
import { officeBySlug } from "@/lib/offices";

/**
 * Tell someone they can't recommend to an office they don't work in, and
 * offer to take them to their own.
 */
export function useNotAllowedNotice() {
  const router = useRouter();
  return (persona: Persona, targetOffice: string) => {
    const target = officeBySlug.get(targetOffice);
    const home = officeBySlug.get(persona.office);
    toast.error(`You can’t recommend to ${target?.city ?? "this office"}`, {
      id: `not-allowed-${persona.id}-${targetOffice}`,
      description: `Only people who work in ${target?.city ?? "this office"} can add to its shelf. ${persona.name.split(" ")[0]}’s office is ${home?.city}.`,
      action: home
        ? { label: `Go to ${home.city}`, onClick: () => router.push(`/offices/${home.slug}`) }
        : undefined,
    });
  };
}
