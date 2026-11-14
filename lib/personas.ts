import type { TagId } from "./tags";

export interface Persona {
  id: string;
  name: string;
  age: number;
  role: string;
  /** Office slug this person belongs to. */
  office: string;
  /** One-line self-description in their own voice. */
  blurb: string;
  /** What they'd say if you asked why they read. */
  motto: string;
  interests: TagId[];
  traits: string[];
  accent: string;
}

/**
 * Three readers, three different shelves. Each one is the same catalogue seen
 * through a different set of interests, so ranking them tells you something
 * about the person as much as the books.
 */
export const PERSONAS: Persona[] = [
  {
    id: "maya-chen",
    name: "Maya Chen",
    age: 29,
    role: "Rates & digital assets analyst",
    office: "new-york-madison-ave",
    blurb:
      "Runs on espresso and earnings calls. Will explain a yield curve to anyone who makes eye contact.",
    motto: "If it isn't priced, it isn't real.",
    interests: ["finance", "strategy", "ai"],
    traits: ["Extrovert", "Finance", "Crypto"],
    accent: "#3480eb",
  },
  {
    id: "jonah-reed",
    name: "Jonah Reed",
    age: 34,
    role: "Copywriter",
    office: "atlanta",
    blurb:
      "Writes longhand, edits out loud, leaves the party at 9:30 without saying goodbye.",
    motto: "The sentence is the idea.",
    interests: ["storytelling", "culture", "communication"],
    traits: ["Introvert", "Writing", "Humanities"],
    accent: "#7c5cd6",
  },
  {
    id: "aarav-mehta",
    name: "Aarav Mehta",
    age: 19,
    role: "Research intern",
    office: "austin-400-w-6th",
    blurb:
      "Cell biology student on a gap year. Reads about cells at lunch and everything else after midnight.",
    motto: "Everything alive is a system that solved a problem.",
    interests: ["data", "wellbeing", "culture"],
    traits: ["Gen Z", "Cell biology", "Quietly curious"],
    accent: "#0f9d8a",
  },
];

export const personaById = new Map(PERSONAS.map((persona) => [persona.id, persona]));

export const DEFAULT_PERSONA_ID = PERSONAS[0].id;

export function getPersona(id: string): Persona | undefined {
  return personaById.get(id);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** The people whose interests overlap this persona the least. */
export function oppositesOf(persona: Persona, count = 2): Persona[] {
  return [...PERSONAS]
    .filter((other) => other.id !== persona.id)
    .map((other) => ({
      other,
      overlap: other.interests.filter((tag) => persona.interests.includes(tag)).length,
    }))
    .sort((a, b) => a.overlap - b.overlap || a.other.id.localeCompare(b.other.id))
    .slice(0, count)
    .map((entry) => entry.other);
}
