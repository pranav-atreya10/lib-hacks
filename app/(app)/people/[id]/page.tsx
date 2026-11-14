import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPersona, PERSONAS } from "@/lib/personas";
import { PersonaDashboard } from "@/components/persona-dashboard";

export function generateStaticParams() {
  return PERSONAS.map((persona) => ({ id: persona.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/people/[id]">): Promise<Metadata> {
  const { id } = await params;
  const persona = getPersona(id);
  if (!persona) return { title: "Person not found" };
  return {
    title: `${persona.name}'s shelf`,
    description: `${persona.role} in ${persona.office.replace(/-/g, " ")}. Ranked for ${persona.interests.join(", ")}.`,
  };
}

export default async function PersonaPage({ params }: PageProps<"/people/[id]">) {
  const { id } = await params;
  const persona = getPersona(id);
  if (!persona) notFound();

  return <PersonaDashboard personaId={persona.id} />;
}
