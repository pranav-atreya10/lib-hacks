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
import { isTag, type TagId } from "@/lib/tags";
import { getPersona, PERSONAS, type Persona } from "@/lib/personas";
import {
  addedToResource,
  emptyEngagement,
  rankResources,
  rankTrending,
  reviewsFor,
  statsAcross,
  type AddedResource,
  type PersonaEngagement,
  type RankedResource,
} from "@/lib/personalize";
import type { Review, Stats } from "@/lib/engagement";

const STORAGE_KEY = "infinite-library:v2";

/** Visitors can look at everything and change nothing; only their views count. */
export const VISITOR_KEY = "visitor";

/** A tag someone added to a file in their own office. */
export interface TagAdd {
  tag: TagId;
  personaId: string;
  at: string;
}

interface StoredState {
  personaId: string | null;
  people: Record<string, PersonaEngagement>;
  tagAdds: Record<string, TagAdd[]>;
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
  /** Who is reading, or null for a view-only visitor. */
  persona: Persona | null;
  personaId: string | null;
  setPersonaId: (id: string | null) => void;
  hydrated: boolean;
  /** This reader's own activity (the visitor's views when nobody is picked). */
  engagement: PersonaEngagement;
  /** Every person's saved activity, so a shelf can be read without switching. */
  people: Record<string, PersonaEngagement>;
  /** False for the visitor: liking, reviewing, adding and tagging need a person. */
  canInteract: boolean;
  canTag: (resource: Resource) => boolean;
  toggleLike: (resourceId: string) => void;
  isLiked: (resourceId: string) => boolean;
  markViewed: (resourceId: string) => void;
  addReview: (resourceId: string, rating: number, body: string) => void;
  addResource: (input: NewResourceInput) => AddedResource | null;
  /** Delete a file. Only the person who recommended it can. */
  deleteResource: (resourceId: string) => boolean;
  /** True when the current reader recommended this file. */
  canDelete: (resourceId: string) => boolean;
  addTag: (resourceId: string, tag: TagId) => void;
  removeTag: (resourceId: string, tag: TagId) => void;
  /** Tags people added to this file, with who added them. */
  addedTags: (resourceId: string) => TagAdd[];
  stats: (resource: Resource) => Stats;
  reviews: (resource: Resource) => Review[];
  /** Ranked for the current reader, or by the crowd for a visitor. */
  ranked: (resources?: Resource[]) => RankedResource[];
  /** Ranked for any person, using that person's own activity. */
  rankedFor: (persona: Persona, resources?: Resource[]) => RankedResource[];
  /** Catalogue plus every recommendation people added, with added tags merged in. */
  allResources: Resource[];
  /** Who added a file, when a person did. */
  addedBy: (resourceId: string) => Persona | null;
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
    const tagAdds: Record<string, TagAdd[]> = {};
    if (parsed.tagAdds && typeof parsed.tagAdds === "object") {
      for (const [id, list] of Object.entries(parsed.tagAdds)) {
        if (!Array.isArray(list)) continue;
        tagAdds[id] = list.filter(
          (entry): entry is TagAdd =>
            !!entry && typeof entry === "object" && isTag(String(entry.tag)),
        );
      }
    }
    return {
      personaId:
        typeof parsed.personaId === "string" && getPersona(parsed.personaId)
          ? parsed.personaId
          : null,
      people,
      tagAdds,
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

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function LibraryStateProvider({ children }: { children: React.ReactNode }) {
  const [personaId, setPersonaIdState] = useState<string | null>(null);
  const [people, setPeople] = useState<Record<string, PersonaEngagement>>({});
  const [tagAdds, setTagAdds] = useState<Record<string, TagAdd[]>>({});
  const [hydrated, setHydrated] = useState(false);

  // localStorage only exists in the browser, so it is read after hydration.
  useEffect(() => {
    const stored = readStored();
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from browser storage once
      setPersonaIdState(stored.personaId);
      setPeople(stored.people);
      setTagAdds(stored.tagAdds);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ personaId, people, tagAdds } satisfies StoredState),
      );
    } catch {
      // Private mode or a full quota: the session still works, it just forgets.
    }
  }, [hydrated, personaId, people, tagAdds]);

  const setPersonaId = useCallback((id: string | null) => {
    setPersonaIdState(id && getPersona(id) ? id : null);
  }, []);

  const persona = personaId ? (getPersona(personaId) ?? null) : null;
  const key = persona ? persona.id : VISITOR_KEY;
  const engagement = people[key] ?? emptyEngagement;

  const update = useCallback(
    (mutate: (current: PersonaEngagement) => PersonaEngagement, who = key) => {
      setPeople((previous) => ({
        ...previous,
        [who]: mutate(previous[who] ?? emptyEngagement),
      }));
    },
    [key],
  );

  const toggleLike = useCallback(
    (resourceId: string) => {
      if (!persona) return;
      update((current) =>
        current.likes.includes(resourceId)
          ? { ...current, likes: current.likes.filter((id) => id !== resourceId) }
          : { ...current, likes: [...current.likes, resourceId] },
      );
    },
    [persona, update],
  );

  const isLiked = useCallback(
    (resourceId: string) => engagement.likes.includes(resourceId),
    [engagement.likes],
  );

  const markViewed = useCallback(
    (resourceId: string) => {
      update((current) => ({
        ...current,
        views: { ...current.views, [resourceId]: (current.views[resourceId] ?? 0) + 1 },
      }));
    },
    [update],
  );

  const addReview = useCallback(
    (resourceId: string, rating: number, body: string) => {
      const trimmed = body.trim();
      if (!persona || !trimmed) return;
      update((current) => ({
        ...current,
        reviews: [
          {
            id: makeId("review"),
            resourceId,
            personaId: persona.id,
            author: persona.name,
            rating: Math.min(5, Math.max(1, Math.round(rating))),
            body: trimmed,
            date: today(),
          },
          ...current.reviews,
        ],
      }));
    },
    [persona, update],
  );

  const addResource = useCallback(
    (input: NewResourceInput): AddedResource | null => {
      if (!persona) return null;
      const slug = input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const added: AddedResource = {
        id: `local-${persona.id}-${makeId("f").slice(-8)}`,
        slug: slug || "untitled",
        personaId: persona.id,
        title: input.title.trim(),
        creator: input.creator.trim(),
        type: input.type,
        tags: input.tags,
        length: input.length.trim() || "Open-ended",
        url: input.url.trim(),
        blurb: input.blurb.trim(),
        addedAt: today(),
        // Recommendations always land in the recommender's own office.
        office: persona.office,
      };
      update((current) => ({ ...current, added: [added, ...current.added] }));
      return added;
    },
    [persona, update],
  );

  const canDelete = useCallback(
    (resourceId: string) =>
      !!persona && (people[persona.id]?.added ?? []).some((item) => item.id === resourceId),
    [people, persona],
  );

  const deleteResource = useCallback(
    (resourceId: string) => {
      if (!canDelete(resourceId)) return false;
      // Remove the file, and everything anyone did to it, so no stray likes,
      // views, reviews or tags point at something that no longer exists.
      setPeople((previous) => {
        const next: Record<string, PersonaEngagement> = {};
        for (const [id, engagement] of Object.entries(previous)) {
          const views = { ...engagement.views };
          delete views[resourceId];
          next[id] = {
            added: engagement.added.filter((item) => item.id !== resourceId),
            likes: engagement.likes.filter((id) => id !== resourceId),
            reviews: engagement.reviews.filter((review) => review.resourceId !== resourceId),
            views,
          };
        }
        return next;
      });
      setTagAdds((previous) => {
        if (!(resourceId in previous)) return previous;
        const next = { ...previous };
        delete next[resourceId];
        return next;
      });
      return true;
    },
    [canDelete],
  );

  const baseResources = useMemo(() => {
    const added = PERSONAS.flatMap((person) =>
      (people[person.id]?.added ?? []).map(addedToResource),
    ).sort((a, b) => b.addedAt.localeCompare(a.addedAt));
    return [...added, ...RESOURCES];
  }, [people]);

  const resourceOffice = useMemo(
    () => new Map(baseResources.map((resource) => [resource.id, resource.office])),
    [baseResources],
  );

  const canTag = useCallback(
    (resource: Resource) => !!persona && resource.office === persona.office,
    [persona],
  );

  const addTag = useCallback(
    (resourceId: string, tag: TagId) => {
      if (!persona || resourceOffice.get(resourceId) !== persona.office) return;
      setTagAdds((previous) => {
        const list = previous[resourceId] ?? [];
        if (list.some((entry) => entry.tag === tag)) return previous;
        return {
          ...previous,
          [resourceId]: [...list, { tag, personaId: persona.id, at: today() }],
        };
      });
    },
    [persona, resourceOffice],
  );

  const removeTag = useCallback(
    (resourceId: string, tag: TagId) => {
      if (!persona || resourceOffice.get(resourceId) !== persona.office) return;
      setTagAdds((previous) => ({
        ...previous,
        [resourceId]: (previous[resourceId] ?? []).filter((entry) => entry.tag !== tag),
      }));
    },
    [persona, resourceOffice],
  );

  const addedTags = useCallback(
    (resourceId: string) => tagAdds[resourceId] ?? [],
    [tagAdds],
  );

  // Added tags join the file's own tags, so filters and rankings see them.
  const allResources = useMemo(
    () =>
      baseResources.map((resource) => {
        const extra = tagAdds[resource.id];
        if (!extra || extra.length === 0) return resource;
        const tags = [...resource.tags];
        for (const { tag } of extra) if (!tags.includes(tag)) tags.push(tag);
        return { ...resource, tags };
      }),
    [baseResources, tagAdds],
  );

  const everyone = useMemo(() => Object.values(people), [people]);

  const stats = useCallback(
    (resource: Resource) => statsAcross(resource, everyone),
    [everyone],
  );

  const reviews = useCallback(
    (resource: Resource) => reviewsFor(resource, everyone),
    [everyone],
  );

  const rankedFor = useCallback(
    (who: Persona, resources: Resource[] = allResources) =>
      rankResources(resources, who, people[who.id] ?? emptyEngagement, stats),
    [allResources, people, stats],
  );

  const ranked = useCallback(
    (resources: Resource[] = allResources) =>
      persona ? rankedFor(persona, resources) : rankTrending(resources, stats),
    [allResources, persona, rankedFor, stats],
  );

  const addedBy = useCallback(
    (resourceId: string) => {
      if (!resourceId.startsWith("local-")) return null;
      for (const person of PERSONAS) {
        if (people[person.id]?.added.some((item) => item.id === resourceId)) return person;
      }
      return null;
    },
    [people],
  );

  const value = useMemo<LibraryState>(
    () => ({
      persona,
      personaId: persona?.id ?? null,
      setPersonaId,
      hydrated,
      engagement,
      people,
      canInteract: !!persona,
      canTag,
      toggleLike,
      isLiked,
      markViewed,
      addReview,
      addResource,
      deleteResource,
      canDelete,
      addTag,
      removeTag,
      addedTags,
      stats,
      reviews,
      ranked,
      rankedFor,
      allResources,
      addedBy,
    }),
    [
      addResource,
      canDelete,
      deleteResource,
      addReview,
      addTag,
      addedBy,
      addedTags,
      allResources,
      canTag,
      engagement,
      hydrated,
      isLiked,
      markViewed,
      people,
      persona,
      ranked,
      rankedFor,
      removeTag,
      reviews,
      setPersonaId,
      stats,
      toggleLike,
    ],
  );

  return (
    <LibraryStateContext.Provider value={value}>{children}</LibraryStateContext.Provider>
  );
}

export function useLibraryState(): LibraryState {
  const context = useContext(LibraryStateContext);
  if (!context) {
    throw new Error("useLibraryState must be used inside LibraryStateProvider");
  }
  return context;
}
