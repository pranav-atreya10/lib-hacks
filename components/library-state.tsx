"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { RESOURCES, type Resource } from "@/lib/content";
import type { MediaType } from "@/lib/catalog";
import type { TagId } from "@/lib/tags";
import {
  DEFAULT_PERSONA_ID,
  getPersona,
  type Persona,
} from "@/lib/personas";
import {
  addedToResource,
  emptyEngagement,
  rankResources,
  statsFor,
  type AddedResource,
  type PersonaEngagement,
  type RankedResource,
} from "@/lib/personalize";
import type { Stats } from "@/lib/engagement";

const STORAGE_KEY = "infinite-library:v1";

interface StoredState {
  personaId: string;
  people: Record<string, PersonaEngagement>;
}

export interface NewResourceInput {
  title: string;
  creator: string;
  type: MediaType;
  tags: TagId[];
  length: string;
  url: string;
  blurb: string;
}

interface LibraryState {
  persona: Persona;
  personaId: string;
  setPersonaId: (id: string) => void;
  hydrated: boolean;
  engagement: PersonaEngagement;
  /** Every persona's saved activity, so a shelf can be read without switching. */
  people: Record<string, PersonaEngagement>;
  toggleLike: (resourceId: string) => void;
  markViewed: (resourceId: string) => void;
  addReview: (resourceId: string, rating: number, body: string) => void;
  addResource: (input: NewResourceInput) => AddedResource;
  stats: (resource: Resource) => Stats;
  ranked: (resources?: Resource[]) => RankedResource[];
  /** Catalogue plus this persona's own additions. */
  allResources: Resource[];
}

const LibraryStateContext = createContext<LibraryState | null>(null);

function normalizeEngagement(value: unknown): PersonaEngagement {
  if (!value || typeof value !== "object") return { ...emptyEngagement };
  const candidate = value as Partial<PersonaEngagement>;
  return {
    likes: Array.isArray(candidate.likes)
      ? candidate.likes.filter((id): id is string => typeof id === "string")
      : [],
    views:
      candidate.views && typeof candidate.views === "object" ? candidate.views : {},
    reviews: Array.isArray(candidate.reviews) ? candidate.reviews : [],
    added: Array.isArray(candidate.added) ? candidate.added : [],
  };
}

function readStored(): StoredState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    if (!parsed || typeof parsed !== "object") return null;
    const people: Record<string, PersonaEngagement> = {};
    if (parsed.people && typeof parsed.people === "object") {
      for (const [id, value] of Object.entries(parsed.people)) {
        people[id] = normalizeEngagement(value);
      }
    }
    return {
      personaId:
        typeof parsed.personaId === "string" && getPersona(parsed.personaId)
          ? parsed.personaId
          : DEFAULT_PERSONA_ID,
      people,
    };
  } catch {
    return null;
  }
}

function makeId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${prefix}-${random}`;
}

export function LibraryStateProvider({ children }: { children: React.ReactNode }) {
  const [personaId, setPersonaIdState] = useState(DEFAULT_PERSONA_ID);
  const [people, setPeople] = useState<Record<string, PersonaEngagement>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStored();
    if (stored) {
      setPersonaIdState(stored.personaId);
      setPeople(stored.people);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ personaId, people } satisfies StoredState),
      );
    } catch {
      // Private mode or a full quota: the session still works, it just forgets.
    }
  }, [hydrated, personaId, people]);

  const setPersonaId = useCallback((id: string) => {
    if (getPersona(id)) setPersonaIdState(id);
  }, []);

  const user = getPersona(personaId) ?? getPersona(DEFAULT_PERSONA_ID)!;
  const engagement = people[personaId] ?? emptyEngagement;

  const update = useCallback(
    (mutate: (current: PersonaEngagement) => PersonaEngagement) => {
      setPeople((previous) => ({
        ...previous,
        [personaId]: mutate(previous[personaId] ?? emptyEngagement),
      }));
    },
    [personaId],
  );

  const toggleLike = useCallback(
    (resourceId: string) => {
      update((current) =>
        current.likes.includes(resourceId)
          ? { ...current, likes: current.likes.filter((id) => id !== resourceId) }
          : { ...current, likes: [...current.likes, resourceId] },
      );
    },
    [update],
  );

  const markViewed = useCallback(
    (resourceId: string) => {
      update((current) => ({
        ...current,
        views: {
          ...current.views,
          [resourceId]: (current.views[resourceId] ?? 0) + 1,
        },
      }));
    },
    [update],
  );

  const addReview = useCallback(
    (resourceId: string, rating: number, body: string) => {
      const trimmed = body.trim();
      if (!trimmed) return;
      update((current) => ({
        ...current,
        reviews: [
          {
            id: makeId("review"),
            resourceId,
            personaId,
            author: user.name,
            rating: Math.min(5, Math.max(1, Math.round(rating))),
            body: trimmed,
            date: new Date().toISOString().slice(0, 10),
          },
          ...current.reviews,
        ],
      }));
    },
    [personaId, update, user.name],
  );

  const addResource = useCallback(
    (input: NewResourceInput): AddedResource => {
      const added: AddedResource = {
        id: `local-${personaId}-${hashSuffix()}`,
        slug: input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        personaId,
        title: input.title.trim(),
        creator: input.creator.trim(),
        type: input.type,
        tags: input.tags,
        length: input.length.trim() || "Open-ended",
        url: input.url.trim(),
        blurb: input.blurb.trim(),
        addedAt: new Date().toISOString().slice(0, 10),
        office: user.office,
      };
      update((current) => ({ ...current, added: [added, ...current.added] }));
      return added;
    },
    [personaId, update, user.office],
  );

  const allResources = useMemo(
    () => [...engagement.added.map(addedToResource), ...RESOURCES],
    [engagement.added],
  );

  const stats = useCallback(
    (resource: Resource) => statsFor(resource, engagement),
    [engagement],
  );

  const ranked = useCallback(
    (resources: Resource[] = allResources) =>
      rankResources(resources, user, engagement),
    [allResources, engagement, user],
  );

  const value = useMemo<LibraryState>(
    () => ({
      persona: user,
      personaId,
      setPersonaId,
      hydrated,
      engagement,
      people,
      toggleLike,
      markViewed,
      addReview,
      addResource,
      stats,
      ranked,
      allResources,
    }),
    [
      addResource,
      addReview,
      allResources,
      engagement,
      hydrated,
      people,
      markViewed,
      personaId,
      ranked,
      setPersonaId,
      stats,
      toggleLike,
      user,
    ],
  );

  return (
    <LibraryStateContext.Provider value={value}>{children}</LibraryStateContext.Provider>
  );
}

function hashSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

export function useLibraryState(): LibraryState {
  const context = useContext(LibraryStateContext);
  if (!context) {
    throw new Error("useLibraryState must be used inside LibraryStateProvider");
  }
  return context;
}
