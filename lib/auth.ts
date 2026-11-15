import "server-only";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { one, q, newId } from "./db";
import type { TagId } from "./tags";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

export const SESSION_COOKIE = "il_session";
const SESSION_DAYS = 30;

export type Role = "admin" | "member";

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Membership {
  companyId: string;
  companyName: string;
  companySlug: string;
  companyDomain: string | null;
  plan: string;
  role: Role;
  title: string;
  interests: TagId[];
  onboarded: boolean;
}

export interface Viewer extends User {
  membership: Membership | null;
}

/* ------------------------------------------------------------------ hashing */

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password.normalize("NFKC"), salt, 64);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltB64, keyB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, "base64");
  const actual = await scryptAsync(password.normalize("NFKC"), Buffer.from(saltB64, "base64"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/* ----------------------------------------------------------------- sessions */

function tokenId(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Start a session: the cookie holds a random token, the database only its hash. */
export async function startSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await q("insert into sessions (id, user_id, expires_at) values ($1, $2, $3)", [
    tokenId(token),
    userId,
    expires.toISOString(),
  ]);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await q("delete from sessions where id = $1", [tokenId(token)]);
  jar.delete(SESSION_COOKIE);
}

/** The signed-in user and their company membership, or null. */
export async function getViewer(): Promise<Viewer | null> {
  // Per-request data: never prerender anything that reads the session.
  await connection();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = await one<{
    id: string;
    email: string;
    name: string;
    company_id: string | null;
    company_name: string | null;
    company_slug: string | null;
    company_domain: string | null;
    plan: string | null;
    role: Role | null;
    title: string | null;
    interests: string[] | null;
    onboarded: boolean | null;
  }>(
    `select u.id, u.email, u.name,
            m.company_id, c.name as company_name, c.slug as company_slug, c.domain as company_domain, c.plan,
            m.role, m.title, m.interests, m.onboarded
       from sessions s
       join users u on u.id = s.user_id
       left join memberships m on m.user_id = u.id
       left join companies c on c.id = m.company_id
      where s.id = $1 and s.expires_at > now()
      order by m.joined_at asc
      limit 1`,
    [tokenId(token)],
  );
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    membership:
      row.company_id && row.role
        ? {
            companyId: row.company_id,
            companyName: row.company_name ?? "",
            companySlug: row.company_slug ?? "",
            companyDomain: row.company_domain,
            plan: row.plan ?? "starter",
            role: row.role,
            title: row.title ?? "",
            interests: (row.interests ?? []) as TagId[],
            onboarded: !!row.onboarded,
          }
        : null,
  };
}

/** For app pages: a signed-in, onboarded member. Redirects otherwise. */
export async function requireMember(): Promise<Viewer & { membership: Membership }> {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in");
  if (!viewer.membership || !viewer.membership.onboarded) redirect("/onboarding");
  return viewer as Viewer & { membership: Membership };
}

export async function requireCompanyAdmin() {
  const viewer = await requireMember();
  if (viewer.membership.role !== "admin") redirect("/app");
  return viewer;
}

export async function createUser(email: string, name: string, password: string): Promise<string> {
  const id = newId();
  await q("insert into users (id, email, name, password_hash) values ($1, $2, $3, $4)", [
    id,
    email,
    name,
    await hashPassword(password),
  ]);
  return id;
}
