import "server-only";
import { one, q } from "./db";
import type { TagId } from "./tags";
import { currentMonth } from "./insights";

export interface LibraryInfo {
  id: string;
  companyId: string;
  name: string;
  description: string;
  visibility: "open" | "private";
  isDefault: boolean;
  createdAt: string;
  collections: string[];
}

export async function getLibrary(companyId: string, libraryId: string): Promise<LibraryInfo | null> {
  const row = await one<{
    id: string;
    company_id: string;
    name: string;
    description: string;
    visibility: "open" | "private";
    is_default: boolean;
    created_at: Date | string;
    collections: string[] | null;
  }>(
    `select l.*, (select array_agg(collection_key) from library_collections c where c.library_id = l.id) as collections
       from libraries l where l.id = $1 and l.company_id = $2`,
    [libraryId, companyId],
  );
  if (!row) return null;
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    description: row.description,
    visibility: row.visibility,
    isDefault: row.is_default,
    createdAt: new Date(row.created_at).toISOString(),
    collections: row.collections ?? [],
  };
}

export interface Person {
  id: string;
  name: string;
  email: string;
  title: string;
  interests: TagId[];
  role: "admin" | "member";
  joinedAt: string;
}

export async function libraryMembers(libraryId: string, companyId: string): Promise<Person[]> {
  const rows = await q<{
    id: string;
    name: string;
    email: string;
    title: string;
    interests: string[];
    role: "admin" | "member";
    joined_at: Date | string;
  }>(
    `select u.id, u.name, u.email, m.title, m.interests, lm.role, lm.joined_at
       from library_members lm
       join users u on u.id = lm.user_id
       join memberships m on m.user_id = u.id and m.company_id = $2
      where lm.library_id = $1
      order by lm.role asc, u.name asc`,
    [libraryId, companyId],
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    title: row.title,
    interests: row.interests as TagId[],
    role: row.role,
    joinedAt: new Date(row.joined_at).toISOString(),
  }));
}

export async function companyPeople(companyId: string): Promise<(Person & { libraries: number })[]> {
  const rows = await q<{
    id: string;
    name: string;
    email: string;
    title: string;
    interests: string[];
    role: "admin" | "member";
    joined_at: Date | string;
    libraries: string | number;
  }>(
    `select u.id, u.name, u.email, m.title, m.interests, m.role, m.joined_at,
            (select count(*) from library_members lm join libraries l on l.id = lm.library_id
              where lm.user_id = u.id and l.company_id = $1) as libraries
       from memberships m join users u on u.id = m.user_id
      where m.company_id = $1
      order by u.name asc`,
    [companyId],
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    title: row.title,
    interests: row.interests as TagId[],
    role: row.role,
    joinedAt: new Date(row.joined_at).toISOString(),
    libraries: Number(row.libraries),
  }));
}

export interface Assignment {
  id: string;
  libraryId: string;
  libraryName: string;
  leadName: string;
  memberId: string;
  itemKey: string;
  note: string;
  createdAt: string;
  completedAt: string | null;
}

export async function assignments(where: { memberId?: string; libraryId?: string }, companyId: string): Promise<Assignment[]> {
  const rows = await q<{
    id: string;
    library_id: string;
    library_name: string;
    lead_name: string;
    member_id: string;
    item_key: string;
    note: string;
    created_at: Date | string;
    completed_at: Date | string | null;
  }>(
    `select a.id, a.library_id, l.name as library_name, u.name as lead_name, a.member_id, a.item_key, a.note,
            a.created_at, a.completed_at
       from assignments a
       join libraries l on l.id = a.library_id
       join users u on u.id = a.lead_id
      where a.company_id = $1
        and ($2::text is null or a.member_id = $2)
        and ($3::text is null or a.library_id = $3)
      order by a.completed_at nulls first, a.created_at desc`,
    [companyId, where.memberId ?? null, where.libraryId ?? null],
  );
  return rows.map((row) => ({
    id: row.id,
    libraryId: row.library_id,
    libraryName: row.library_name,
    leadName: row.lead_name,
    memberId: row.member_id,
    itemKey: row.item_key,
    note: row.note,
    createdAt: new Date(row.created_at).toISOString(),
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
  }));
}

export interface Note {
  id: string;
  libraryId: string;
  libraryName: string;
  leadName: string;
  body: string;
  createdAt: string;
}

export async function coachingNotes(memberId: string, companyId: string, libraryId?: string): Promise<Note[]> {
  const rows = await q<{
    id: string;
    library_id: string;
    library_name: string;
    lead_name: string;
    body: string;
    created_at: Date | string;
  }>(
    `select n.id, n.library_id, l.name as library_name, u.name as lead_name, n.body, n.created_at
       from coaching_notes n
       join libraries l on l.id = n.library_id
       join users u on u.id = n.lead_id
      where n.member_id = $1 and l.company_id = $2 and ($3::text is null or n.library_id = $3)
      order by n.created_at desc`,
    [memberId, companyId, libraryId ?? null],
  );
  return rows.map((row) => ({
    id: row.id,
    libraryId: row.library_id,
    libraryName: row.library_name,
    leadName: row.lead_name,
    body: row.body,
    createdAt: new Date(row.created_at).toISOString(),
  }));
}

export interface Giveaway {
  libraryId: string;
  libraryName: string;
  month: string;
  prize: string;
  winnerId: string | null;
  winnerName: string | null;
}

export async function giveaways(libraryIds: string[]): Promise<Giveaway[]> {
  if (libraryIds.length === 0) return [];
  const rows = await q<{
    library_id: string;
    library_name: string;
    month: string;
    prize: string;
    winner_id: string | null;
    winner_name: string | null;
  }>(
    `select g.library_id, l.name as library_name, g.month, g.prize, g.winner_id, u.name as winner_name
       from giveaways g
       join libraries l on l.id = g.library_id
       left join users u on u.id = g.winner_id
      where g.library_id = any($1) and g.month = $2`,
    [libraryIds, currentMonth()],
  );
  return rows.map((row) => ({
    libraryId: row.library_id,
    libraryName: row.library_name,
    month: row.month,
    prize: row.prize,
    winnerId: row.winner_id,
    winnerName: row.winner_name,
  }));
}

/** This month's activity score per person, to help a lead pick a giveaway winner. */
export async function monthScores(companyId: string, userIds: string[]): Promise<Map<string, number>> {
  if (userIds.length === 0) return new Map();
  const month = currentMonth();
  const rows = await q<{ user_id: string; score: string | number }>(
    `select user_id, sum(points) as score from (
       select user_id, 1 as points from views where company_id = $1 and to_char(created_at, 'YYYY-MM') = $3 and user_id = any($2)
       union all
       select user_id, 2 from likes where company_id = $1 and to_char(created_at, 'YYYY-MM') = $3 and user_id = any($2)
       union all
       select user_id, 5 from reviews where company_id = $1 and to_char(created_at, 'YYYY-MM') = $3 and user_id = any($2)
       union all
       select added_by, 5 from items where company_id = $1 and to_char(created_at, 'YYYY-MM') = $3 and added_by = any($2)
     ) as activity group by user_id`,
    [companyId, userIds, month],
  );
  return new Map(rows.map((row) => [row.user_id, Number(row.score)]));
}
