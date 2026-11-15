"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { refresh } from "next/cache";
import { q, one, newId } from "@/lib/db";
import {
  createUser,
  endSession,
  getViewer,
  requireMember,
  startSession,
  verifyPassword,
  type Role,
} from "@/lib/auth";
import { COLLECTIONS, templateByKey } from "@/lib/marketplace";
import { isTag, type TagId } from "@/lib/tags";
import { currentMonth } from "@/lib/insights";
import { findItem } from "@/lib/library";
import type { MediaType } from "@/lib/catalog";

export interface FormState {
  error?: string;
  ok?: string;
}

const TYPES: MediaType[] = ["book", "podcast", "video", "article"];

/** Email providers anyone can sign up with: never used for automatic joining. */
const PUBLIC_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "yahoo.com",
  "icloud.com",
  "me.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
]);

function text(form: FormData, name: string, max = 200): string {
  return String(form.get(name) ?? "").trim().slice(0, max);
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function emailDomain(email: string): string {
  return email.split("@")[1]?.toLowerCase() ?? "";
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) || "company"
  );
}

async function companyAdminOrFail() {
  const viewer = await requireMember();
  if (viewer.membership.role !== "admin") throw new Error("Only company admins can do that.");
  return viewer;
}

/** The viewer's role in a library of their company: "admin", "member" or null. */
async function libraryRole(libraryId: string, userId: string, companyId: string) {
  const row = await one<{ role: "admin" | "member" | null; visibility: string }>(
    `select m.role, l.visibility from libraries l
       left join library_members m on m.library_id = l.id and m.user_id = $2
      where l.id = $1 and l.company_id = $3`,
    [libraryId, userId, companyId],
  );
  return row ? { role: row.role, visibility: row.visibility } : null;
}

/** Library admins run their library; company admins can step in anywhere. */
async function libraryAdminOrFail(libraryId: string) {
  const viewer = await requireMember();
  const access = await libraryRole(libraryId, viewer.id, viewer.membership.companyId);
  if (!access) throw new Error("That library doesn't exist.");
  if (access.role !== "admin" && viewer.membership.role !== "admin") {
    throw new Error("Only this library's admins can do that.");
  }
  return viewer;
}

async function libraryMember(libraryId: string, userId: string) {
  return one("select 1 from library_members where library_id = $1 and user_id = $2", [libraryId, userId]);
}

async function addToDefaultLibrary(companyId: string, userId: string) {
  const library = await one<{ id: string }>(
    "select id from libraries where company_id = $1 and is_default = true limit 1",
    [companyId],
  );
  if (library) {
    await q("insert into library_members (library_id, user_id) values ($1, $2) on conflict do nothing", [
      library.id,
      userId,
    ]);
  }
}

async function joinCompanyAs(userId: string, companyId: string, role: Role) {
  await q("insert into memberships (user_id, company_id, role) values ($1, $2, $3) on conflict do nothing", [
    userId,
    companyId,
    role,
  ]);
  await addToDefaultLibrary(companyId, userId);
}

/* ------------------------------------------------------------------ account */

export async function signUp(_: FormState, form: FormData): Promise<FormState> {
  const name = text(form, "name", 80);
  const email = text(form, "email", 160).toLowerCase();
  const password = String(form.get("password") ?? "");
  const invite = text(form, "invite", 40);
  if (!name) return { error: "Add your name." };
  if (!validEmail(email)) return { error: "That email doesn't look right." };
  if (password.length < 8) return { error: "Use at least 8 characters for your password." };
  if (await one("select 1 from users where email = $1", [email])) {
    return { error: "There's already an account with that email. Sign in instead." };
  }
  const userId = await createUser(email, name, password);
  await startSession(userId);
  if (invite) {
    await joinWithCode(userId, invite);
  } else {
    // Work email on a domain a company has claimed: we can't prove they own the
    // address yet, so it becomes a request the company's admins approve.
    const company = await one<{ id: string }>("select id from companies where domain = $1", [emailDomain(email)]);
    if (company) {
      await q("insert into join_requests (user_id, company_id) values ($1, $2) on conflict do nothing", [
        userId,
        company.id,
      ]);
    }
  }
  redirect("/onboarding");
}

/** Wrong passwords allowed per account, and per connection, in the window. */
const MAX_PER_ACCOUNT = 5;
const MAX_PER_IP = 30;
const WINDOW_MINUTES = 15;

async function clientIp(): Promise<string> {
  const list = await headers();
  return (list.get("x-forwarded-for")?.split(",")[0] ?? list.get("x-real-ip") ?? "").trim().slice(0, 64);
}

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email", 160).toLowerCase();
  const password = String(form.get("password") ?? "");
  const ip = await clientIp();

  // Lock out repeated guessing before checking anything, so a locked account
  // can't be confirmed even with the right password.
  const recent = await one<{ by_email: string | number; by_ip: string | number; oldest: Date | string | null }>(
    `select count(*) filter (where email = $1) as by_email,
            count(*) filter (where ip = $2 and $2 <> '') as by_ip,
            min(attempted_at) filter (where email = $1) as oldest
       from login_attempts
      where attempted_at > now() - interval '${WINDOW_MINUTES} minutes' and (email = $1 or ip = $2)`,
    [email, ip],
  );
  if (Number(recent?.by_email ?? 0) >= MAX_PER_ACCOUNT || Number(recent?.by_ip ?? 0) >= MAX_PER_IP) {
    const oldest = recent?.oldest ? new Date(recent.oldest).getTime() : Date.now();
    const minutes = Math.max(1, Math.ceil((oldest + WINDOW_MINUTES * 60_000 - Date.now()) / 60_000));
    return { error: `Too many wrong passwords. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` };
  }

  const user = await one<{ id: string; password_hash: string }>(
    "select id, password_hash from users where email = $1",
    [email],
  );
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    await q("insert into login_attempts (email, ip) values ($1, $2)", [email, ip]);
    await q("delete from login_attempts where attempted_at < now() - interval '1 day'");
    const left = MAX_PER_ACCOUNT - Number(recent?.by_email ?? 0) - 1;
    return {
      error:
        left > 0 && left <= 2
          ? `That email and password don't match. ${left} ${left === 1 ? "try" : "tries"} left before a ${WINDOW_MINUTES}-minute lock.`
          : left <= 0
            ? `Too many wrong passwords. Try again in ${WINDOW_MINUTES} minutes.`
            : "That email and password don't match.",
    };
  }
  await q("delete from login_attempts where email = $1", [email]);
  await startSession(user.id);
  const next = text(form, "next", 200);
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/app");
}

export async function signOut(): Promise<void> {
  await endSession();
  redirect("/");
}

/* --------------------------------------------------------------- onboarding */

async function joinWithCode(userId: string, code: string): Promise<string | null> {
  const invite = await one<{ company_id: string; role: Role }>(
    "select company_id, role from invites where code = $1 and revoked = false",
    [code],
  );
  if (!invite) return "That invite link isn't valid any more. Ask your admin for a new one.";
  if (await one("select 1 from memberships where user_id = $1", [userId])) return "You're already in a company.";
  await q("delete from join_requests where user_id = $1", [userId]);
  await joinCompanyAs(userId, invite.company_id, invite.role);
  return null;
}

export async function createCompany(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in");
  if (viewer.membership) return { ok: "exists" };
  const name = text(form, "company", 80);
  if (name.length < 2) return { error: "Add your company's name." };
  const claim = form.get("claimDomain") === "on";
  const domain = emailDomain(viewer.email);
  if (claim && PUBLIC_DOMAINS.has(domain)) {
    return { error: `Anyone can sign up with @${domain}, so it can't be used to auto-join. Untick it, or use your work email.` };
  }
  if (claim && (await one("select 1 from companies where domain = $1", [domain]))) {
    return { error: `@${domain} already belongs to a workspace. Ask its admin for an invite.` };
  }

  let slug = slugify(name);
  if (await one("select 1 from companies where slug = $1", [slug])) slug = `${slug}-${newId().slice(0, 4)}`;
  const companyId = newId();
  await q("insert into companies (id, name, slug, domain, created_by) values ($1, $2, $3, $4, $5)", [
    companyId,
    name,
    slug,
    claim ? domain : null,
    viewer.id,
  ]);
  // Every company starts with one open library everybody is in.
  const libraryId = newId();
  await q(
    `insert into libraries (id, company_id, name, description, visibility, is_default, created_by)
     values ($1, $2, $3, $4, 'open', true, $5)`,
    [libraryId, companyId, `Everyone at ${name}`, "The company-wide shelf. Everyone is in it.", viewer.id],
  );
  await q("insert into memberships (user_id, company_id, role) values ($1, $2, 'admin')", [viewer.id, companyId]);
  await q("delete from join_requests where user_id = $1", [viewer.id]);
  await q("insert into library_members (library_id, user_id, role) values ($1, $2, 'admin')", [
    libraryId,
    viewer.id,
  ]);
  refresh();
  return { ok: "created" };
}

export async function joinCompany(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in");
  const raw = text(form, "code", 200);
  // Accept a whole invite link or just its code.
  const code = raw.split("/").filter(Boolean).at(-1) ?? "";
  const error = await joinWithCode(viewer.id, code);
  if (error) return { error };
  refresh();
  return { ok: "joined" };
}

export async function finishOnboarding(form: FormData): Promise<void> {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in");
  if (!viewer.membership) redirect("/onboarding");
  const companyId = viewer.membership.companyId;
  const interests = form.getAll("interest").map(String).filter(isTag).slice(0, 8);
  const title = text(form, "title", 80);
  const liked = form.getAll("like").map(String).filter((key) => /^c-[a-z0-9-]+$/.test(key)).slice(0, 20);
  const collections = form
    .getAll("collection")
    .map(String)
    .filter((key) => COLLECTIONS.some((collection) => collection.key === key));

  await q(
    "update memberships set interests = $1, title = $2, onboarded = true where user_id = $3 and company_id = $4",
    [interests, title, viewer.id, companyId],
  );
  // The company's creator stocks the company-wide library.
  if (viewer.membership.role === "admin") {
    const library = await one<{ id: string }>(
      "select id from libraries where company_id = $1 and is_default = true limit 1",
      [companyId],
    );
    if (library) {
      for (const key of collections) {
        await q(
          "insert into library_collections (library_id, collection_key, added_by) values ($1, $2, $3) on conflict do nothing",
          [library.id, key, viewer.id],
        );
      }
    }
  }
  for (const key of liked) {
    await q("insert into likes (company_id, user_id, item_key) values ($1, $2, $3) on conflict do nothing", [
      companyId,
      viewer.id,
      key,
    ]);
  }
  redirect("/app");
}

export async function updateProfile(form: FormData): Promise<void> {
  const viewer = await requireMember();
  const interests = form.getAll("interest").map(String).filter(isTag).slice(0, 8);
  const title = text(form, "title", 80);
  await q("update memberships set interests = $1, title = $2 where user_id = $3 and company_id = $4", [
    interests,
    title,
    viewer.id,
    viewer.membership.companyId,
  ]);
  refresh();
}

/* ---------------------------------------------------------------- libraries */

export async function createLibrary(_: FormState, form: FormData): Promise<FormState & { id?: string }> {
  const viewer = await requireMember();
  const name = text(form, "name", 80);
  if (name.length < 2) return { error: "Give the library a name." };
  const visibility = form.get("visibility") === "private" ? "private" : "open";
  const template = templateByKey(text(form, "template", 40));
  const id = newId();
  await q(
    `insert into libraries (id, company_id, name, description, visibility, created_by)
     values ($1, $2, $3, $4, $5, $6)`,
    [id, viewer.membership.companyId, name, text(form, "description", 280) || template?.description || "", visibility, viewer.id],
  );
  await q("insert into library_members (library_id, user_id, role) values ($1, $2, 'admin')", [id, viewer.id]);
  for (const key of template?.collections ?? []) {
    await q("insert into library_collections (library_id, collection_key, added_by) values ($1, $2, $3)", [
      id,
      key,
      viewer.id,
    ]);
  }
  redirect(`/app/libraries/${id}`);
}

export async function setLibraryMembership(libraryId: string, join: boolean): Promise<FormState> {
  const viewer = await requireMember();
  const access = await libraryRole(libraryId, viewer.id, viewer.membership.companyId);
  if (!access) return { error: "That library doesn't exist." };
  if (join) {
    if (access.visibility !== "open") return { error: "This library is private. Ask its admin to add you." };
    await q("insert into library_members (library_id, user_id) values ($1, $2) on conflict do nothing", [
      libraryId,
      viewer.id,
    ]);
  } else {
    if (access.role === "admin") {
      const admins = await one<{ count: string | number }>(
        "select count(*) as count from library_members where library_id = $1 and role = 'admin'",
        [libraryId],
      );
      if (Number(admins?.count ?? 0) <= 1) return { error: "Make someone else an admin before you leave." };
    }
    await q("delete from library_members where library_id = $1 and user_id = $2", [libraryId, viewer.id]);
  }
  refresh();
  return { ok: join ? "joined" : "left" };
}

export async function addLibraryMember(libraryId: string, userId: string): Promise<void> {
  const viewer = await libraryAdminOrFail(libraryId);
  const colleague = await one("select 1 from memberships where user_id = $1 and company_id = $2", [
    userId,
    viewer.membership.companyId,
  ]);
  if (!colleague) return;
  await q("insert into library_members (library_id, user_id) values ($1, $2) on conflict do nothing", [
    libraryId,
    userId,
  ]);
  refresh();
}

export async function setLibraryRole(libraryId: string, userId: string, role: "admin" | "member"): Promise<FormState> {
  await libraryAdminOrFail(libraryId);
  if (role === "member") {
    const admins = await one<{ count: string | number }>(
      "select count(*) as count from library_members where library_id = $1 and role = 'admin'",
      [libraryId],
    );
    if (Number(admins?.count ?? 0) <= 1) return { error: "A library needs at least one admin." };
  }
  await q("update library_members set role = $1 where library_id = $2 and user_id = $3", [role, libraryId, userId]);
  refresh();
  return { ok: "updated" };
}

export async function removeLibraryMember(libraryId: string, userId: string): Promise<void> {
  const viewer = await libraryAdminOrFail(libraryId);
  if (userId === viewer.id) return;
  await q("delete from library_members where library_id = $1 and user_id = $2", [libraryId, userId]);
  refresh();
}

export async function addCollection(libraryId: string, key: string): Promise<void> {
  const viewer = await libraryAdminOrFail(libraryId);
  if (!COLLECTIONS.some((collection) => collection.key === key)) return;
  await q(
    "insert into library_collections (library_id, collection_key, added_by) values ($1, $2, $3) on conflict do nothing",
    [libraryId, key, viewer.id],
  );
  refresh();
}

export async function removeCollection(libraryId: string, key: string): Promise<void> {
  await libraryAdminOrFail(libraryId);
  await q("delete from library_collections where library_id = $1 and collection_key = $2", [libraryId, key]);
  refresh();
}

/* ------------------------------------------------------------------ reading */

export async function toggleLike(itemKey: string): Promise<void> {
  const viewer = await requireMember();
  const companyId = viewer.membership.companyId;
  const removed = await q(
    "delete from likes where company_id = $1 and user_id = $2 and item_key = $3 returning item_key",
    [companyId, viewer.id, itemKey],
  );
  if (removed.length === 0) {
    await q("insert into likes (company_id, user_id, item_key) values ($1, $2, $3)", [
      companyId,
      viewer.id,
      itemKey.slice(0, 80),
    ]);
  }
  refresh();
}

export async function recordView(itemKey: string): Promise<void> {
  const viewer = await requireMember();
  const companyId = viewer.membership.companyId;
  await q("insert into views (company_id, user_id, item_key) values ($1, $2, $3)", [
    companyId,
    viewer.id,
    itemKey.slice(0, 80),
  ]);
  // Opening an assigned read counts as doing it.
  await q(
    `update assignments set completed_at = now()
      where company_id = $1 and member_id = $2 and item_key = $3 and completed_at is null`,
    [companyId, viewer.id, itemKey],
  );
}

export async function addReview(itemKey: string, rating: number, body: string): Promise<FormState> {
  const viewer = await requireMember();
  const trimmed = body.trim().slice(0, 1200);
  if (!trimmed) return { error: "Write a sentence or two first." };
  const stars = Math.min(5, Math.max(1, Math.round(rating)));
  await q(
    "insert into reviews (id, company_id, user_id, item_key, rating, body) values ($1, $2, $3, $4, $5, $6)",
    [newId(), viewer.membership.companyId, viewer.id, itemKey.slice(0, 80), stars, trimmed],
  );
  refresh();
  return { ok: "posted" };
}

export interface NewItemInput {
  libraryId: string;
  title: string;
  creator: string;
  type: MediaType;
  url: string;
  length: string;
  blurb: string;
  tags: TagId[];
}

/** Anyone in a library can recommend to it. */
export async function addItem(input: NewItemInput): Promise<FormState & { key?: string }> {
  const viewer = await requireMember();
  const companyId = viewer.membership.companyId;
  if (!(await libraryMember(input.libraryId, viewer.id))) {
    return { error: "Join this library to recommend to it." };
  }
  const title = input.title.trim().slice(0, 160);
  const url = input.url.trim().slice(0, 600);
  if (!title) return { error: "Give it a title." };
  if (!/^https?:\/\/\S+\.\S+/.test(url)) return { error: "Add a link that starts with http:// or https://" };
  if (!TYPES.includes(input.type)) return { error: "Pick a kind of file." };
  const id = newId();
  await q(
    `insert into items (id, company_id, library_id, added_by, title, creator, type, url, blurb, length, tags)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      id,
      companyId,
      input.libraryId,
      viewer.id,
      title,
      input.creator.trim().slice(0, 120),
      input.type,
      url,
      input.blurb.trim().slice(0, 400),
      input.length.trim().slice(0, 40),
      input.tags.filter(isTag).slice(0, 3),
    ],
  );
  refresh();
  return { ok: "added", key: `i-${id}` };
}

/** The person who added a file can delete it; so can its library's admins. */
export async function deleteItem(itemKey: string): Promise<FormState> {
  const viewer = await requireMember();
  const companyId = viewer.membership.companyId;
  if (!itemKey.startsWith("i-")) return { error: "Only files people added can be deleted." };
  const id = itemKey.slice(2);
  const item = await one<{ added_by: string | null; library_id: string }>(
    "select added_by, library_id from items where id = $1 and company_id = $2",
    [id, companyId],
  );
  if (!item) return { error: "That file is already gone." };
  const access = await libraryRole(item.library_id, viewer.id, companyId);
  const allowed =
    item.added_by === viewer.id || access?.role === "admin" || viewer.membership.role === "admin";
  if (!allowed) return { error: "Only the person who added it, or a library admin, can delete it." };
  for (const table of ["likes", "views", "reviews", "item_tags", "assignments"]) {
    await q(`delete from ${table} where company_id = $1 and item_key = $2`, [companyId, itemKey]);
  }
  await q("delete from items where id = $1 and company_id = $2", [id, companyId]);
  refresh();
  return { ok: "deleted" };
}

export async function addTag(itemKey: string, tag: string): Promise<void> {
  const viewer = await requireMember();
  if (!isTag(tag)) return;
  await q(
    "insert into item_tags (company_id, item_key, tag, added_by) values ($1, $2, $3, $4) on conflict do nothing",
    [viewer.membership.companyId, itemKey.slice(0, 80), tag, viewer.id],
  );
  refresh();
}

export async function removeTag(itemKey: string, tag: string): Promise<void> {
  const viewer = await requireMember();
  await q(
    "delete from item_tags where company_id = $1 and item_key = $2 and tag = $3 and (added_by = $4 or $5)",
    [viewer.membership.companyId, itemKey, tag, viewer.id, viewer.membership.role === "admin"],
  );
  refresh();
}

/* ------------------------------------------------------------------ coaching */

export async function addCoachingNote(libraryId: string, memberId: string, body: string): Promise<FormState> {
  const viewer = await libraryAdminOrFail(libraryId);
  const trimmed = body.trim().slice(0, 1200);
  if (!trimmed) return { error: "Write the note first." };
  if (!(await libraryMember(libraryId, memberId))) return { error: "They're not in this library." };
  await q("insert into coaching_notes (id, library_id, lead_id, member_id, body) values ($1, $2, $3, $4, $5)", [
    newId(),
    libraryId,
    viewer.id,
    memberId,
    trimmed,
  ]);
  refresh();
  return { ok: "saved" };
}

export async function assignRead(libraryId: string, memberId: string, itemKey: string, note: string): Promise<FormState> {
  const viewer = await libraryAdminOrFail(libraryId);
  const companyId = viewer.membership.companyId;
  if (!(await libraryMember(libraryId, memberId))) return { error: "They're not in this library." };
  if (!(await findItem(companyId, itemKey))) return { error: "Pick a file from the library." };
  await q(
    `insert into assignments (id, company_id, library_id, lead_id, member_id, item_key, note)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [newId(), companyId, libraryId, viewer.id, memberId, itemKey, note.trim().slice(0, 300)],
  );
  refresh();
  return { ok: "assigned" };
}

export async function removeAssignment(libraryId: string, id: string): Promise<void> {
  await libraryAdminOrFail(libraryId);
  await q("delete from assignments where id = $1 and library_id = $2", [id, libraryId]);
  refresh();
}

/* ------------------------------------------------------------------ giveaway */

export async function setGiveawayPrize(libraryId: string, prize: string): Promise<void> {
  await libraryAdminOrFail(libraryId);
  await q(
    `insert into giveaways (library_id, month, prize) values ($1, $2, $3)
     on conflict (library_id, month) do update set prize = excluded.prize`,
    [libraryId, currentMonth(), prize.trim().slice(0, 160)],
  );
  refresh();
}

export async function pickGiveawayWinner(libraryId: string, userId: string | null): Promise<void> {
  const viewer = await libraryAdminOrFail(libraryId);
  if (userId && !(await libraryMember(libraryId, userId))) return;
  await q(
    `insert into giveaways (library_id, month, winner_id, chosen_by, chosen_at) values ($1, $2, $3, $4, now())
     on conflict (library_id, month) do update
       set winner_id = excluded.winner_id, chosen_by = excluded.chosen_by, chosen_at = excluded.chosen_at`,
    [libraryId, currentMonth(), userId, userId ? viewer.id : null],
  );
  refresh();
}

/* --------------------------------------------------------------------- admin */

export async function createInvite(role: Role): Promise<void> {
  const viewer = await companyAdminOrFail();
  if (role !== "admin" && role !== "member") return;
  const code = newId().replace(/-/g, "").slice(0, 12);
  await q("insert into invites (code, company_id, role, created_by) values ($1, $2, $3, $4)", [
    code,
    viewer.membership.companyId,
    role,
    viewer.id,
  ]);
  refresh();
}

export async function revokeInvite(code: string): Promise<void> {
  const viewer = await companyAdminOrFail();
  await q("update invites set revoked = true where code = $1 and company_id = $2", [
    code,
    viewer.membership.companyId,
  ]);
  refresh();
}

export async function setMemberRole(userId: string, role: Role): Promise<FormState> {
  const viewer = await companyAdminOrFail();
  const companyId = viewer.membership.companyId;
  if (role !== "admin" && role !== "member") return { error: "Unknown role." };
  if (role === "member") {
    const admins = await one<{ count: string | number }>(
      "select count(*) as count from memberships where company_id = $1 and role = 'admin'",
      [companyId],
    );
    const target = await one<{ role: Role }>("select role from memberships where company_id = $1 and user_id = $2", [
      companyId,
      userId,
    ]);
    if (target?.role === "admin" && Number(admins?.count ?? 0) <= 1) {
      return { error: "A company needs at least one admin." };
    }
  }
  await q("update memberships set role = $1 where company_id = $2 and user_id = $3", [role, companyId, userId]);
  refresh();
  return { ok: "updated" };
}

export async function updateCompany(_: FormState, form: FormData): Promise<FormState> {
  const viewer = await companyAdminOrFail();
  const companyId = viewer.membership.companyId;
  const name = text(form, "name", 80);
  if (name.length < 2) return { error: "Add the company's name." };
  const domain = text(form, "domain", 120).toLowerCase().replace(/^@/, "");
  if (domain && !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) return { error: "That domain doesn't look right." };
  if (domain && PUBLIC_DOMAINS.has(domain)) return { error: `Anyone can sign up with @${domain}, so it can't be used.` };
  if (domain && domain !== emailDomain(viewer.email)) {
    return { error: `You can only claim your own email's domain (@${emailDomain(viewer.email)}).` };
  }
  if (domain && (await one("select 1 from companies where domain = $1 and id <> $2", [domain, companyId]))) {
    return { error: `@${domain} already belongs to another workspace.` };
  }
  await q("update companies set name = $1, domain = $2 where id = $3", [name, domain || null, companyId]);
  refresh();
  return { ok: "Saved." };
}

export async function decideJoinRequest(userId: string, approve: boolean): Promise<FormState> {
  const viewer = await companyAdminOrFail();
  const companyId = viewer.membership.companyId;
  const request = await one("select 1 from join_requests where user_id = $1 and company_id = $2", [userId, companyId]);
  if (!request) return { error: "That request was already handled." };
  await q("delete from join_requests where user_id = $1", [userId]);
  if (approve) {
    if (await one("select 1 from memberships where user_id = $1", [userId])) {
      return { error: "They already joined another workspace." };
    }
    await joinCompanyAs(userId, companyId, "member");
  }
  refresh();
  return { ok: approve ? "approved" : "declined" };
}

/** Someone waiting for approval can withdraw and start or join elsewhere. */
export async function cancelJoinRequest(): Promise<void> {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in");
  await q("delete from join_requests where user_id = $1", [viewer.id]);
  refresh();
}

/* --------------------------------------------------------------------- sales */

export async function submitSalesLead(_: FormState, form: FormData): Promise<FormState> {
  const name = text(form, "name", 80);
  const email = text(form, "email", 160);
  const company = text(form, "company", 120);
  if (!name || !company) return { error: "Add your name and company." };
  if (!validEmail(email)) return { error: "Add a work email we can reply to." };
  await q(
    "insert into sales_leads (id, name, email, company, size, message) values ($1, $2, $3, $4, $5, $6)",
    [newId(), name, email, company, text(form, "size", 40), text(form, "message", 2000)],
  );
  return { ok: "Thanks — our team will reply within one business day." };
}
