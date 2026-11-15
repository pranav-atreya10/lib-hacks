import "server-only";

/**
 * One tiny query interface over two drivers:
 * - Postgres (Neon on Vercel) when DATABASE_URL is set;
 * - PGlite, an in-process Postgres saved to .data/, for local development.
 *
 * Queries are plain parameterised SQL ($1, $2, …). The schema is created on
 * first use with idempotent statements, so a fresh database needs no setup.
 */

export type Row = Record<string, unknown>;

interface Driver {
  query<T extends Row = Row>(text: string, params?: unknown[]): Promise<T[]>;
  exec(text: string): Promise<void>;
}

export class DatabaseNotConfigured extends Error {
  constructor() {
    super("DATABASE_URL is not set. Connect a Postgres database (e.g. Neon) to this project.");
  }
}

const SCHEMA = `
create table if not exists users (
  id text primary key,
  email text not null unique,
  name text not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);
create table if not exists sessions (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create table if not exists companies (
  id text primary key,
  name text not null,
  slug text not null unique,
  domain text unique,
  plan text not null default 'starter',
  created_by text references users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists memberships (
  user_id text not null references users(id) on delete cascade,
  company_id text not null references companies(id) on delete cascade,
  role text not null check (role in ('admin', 'member')),
  title text not null default '',
  interests text[] not null default '{}',
  onboarded boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (user_id, company_id)
);
create table if not exists invites (
  code text primary key,
  company_id text not null references companies(id) on delete cascade,
  role text not null check (role in ('admin', 'member')),
  created_by text references users(id) on delete set null,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists libraries (
  id text primary key,
  company_id text not null references companies(id) on delete cascade,
  name text not null,
  description text not null default '',
  visibility text not null default 'open' check (visibility in ('open', 'private')),
  is_default boolean not null default false,
  created_by text references users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists library_members (
  library_id text not null references libraries(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (library_id, user_id)
);
create table if not exists library_collections (
  library_id text not null references libraries(id) on delete cascade,
  collection_key text not null,
  added_by text references users(id) on delete set null,
  added_at timestamptz not null default now(),
  primary key (library_id, collection_key)
);
create table if not exists items (
  id text primary key,
  company_id text not null references companies(id) on delete cascade,
  library_id text not null references libraries(id) on delete cascade,
  added_by text references users(id) on delete set null,
  title text not null,
  creator text not null default '',
  type text not null check (type in ('book', 'podcast', 'video', 'article')),
  url text not null,
  blurb text not null default '',
  length text not null default '',
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);
create table if not exists item_tags (
  company_id text not null references companies(id) on delete cascade,
  item_key text not null,
  tag text not null,
  added_by text references users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (company_id, item_key, tag)
);
create table if not exists likes (
  company_id text not null references companies(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  item_key text not null,
  created_at timestamptz not null default now(),
  primary key (company_id, user_id, item_key)
);
create table if not exists views (
  id bigserial primary key,
  company_id text not null references companies(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  item_key text not null,
  created_at timestamptz not null default now()
);
create index if not exists views_company_time on views (company_id, created_at);
create table if not exists reviews (
  id text primary key,
  company_id text not null references companies(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  item_key text not null,
  rating int not null check (rating between 1 and 5),
  body text not null,
  created_at timestamptz not null default now()
);
create table if not exists coaching_notes (
  id text primary key,
  library_id text not null references libraries(id) on delete cascade,
  lead_id text not null references users(id) on delete cascade,
  member_id text not null references users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create table if not exists assignments (
  id text primary key,
  company_id text not null references companies(id) on delete cascade,
  library_id text not null references libraries(id) on delete cascade,
  lead_id text not null references users(id) on delete cascade,
  member_id text not null references users(id) on delete cascade,
  item_key text not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create table if not exists giveaways (
  library_id text not null references libraries(id) on delete cascade,
  month text not null,
  prize text not null default '',
  winner_id text references users(id) on delete set null,
  chosen_by text references users(id) on delete set null,
  chosen_at timestamptz,
  primary key (library_id, month)
);
create table if not exists login_attempts (
  id bigserial primary key,
  email text not null,
  ip text not null default '',
  attempted_at timestamptz not null default now()
);
create index if not exists login_attempts_email on login_attempts (email, attempted_at);
create index if not exists login_attempts_ip on login_attempts (ip, attempted_at);
create table if not exists join_requests (
  user_id text not null references users(id) on delete cascade,
  company_id text not null references companies(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, company_id)
);
create table if not exists sales_leads (
  id text primary key,
  name text not null,
  email text not null,
  company text not null,
  size text not null default '',
  message text not null default '',
  created_at timestamptz not null default now()
);
`;

async function postgresDriver(url: string): Promise<Driver> {
  const { default: postgres } = await import("postgres");
  const sql = postgres(url, { prepare: false, max: 5, idle_timeout: 20 });
  return {
    async query<T extends Row>(text: string, params: unknown[] = []) {
      return (await sql.unsafe(text, params as never[])) as unknown as T[];
    },
    async exec(text: string) {
      await sql.unsafe(text);
    },
  };
}

async function pgliteDriver(): Promise<Driver> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { mkdirSync } = await import("node:fs");
  const dir = `${process.cwd()}/.data/pglite`;
  mkdirSync(dir, { recursive: true });
  const client = new PGlite(dir);
  return {
    async query<T extends Row>(text: string, params: unknown[] = []) {
      const result = await client.query<T>(text, params);
      return result.rows;
    },
    async exec(text: string) {
      await client.exec(text);
    },
  };
}

const globalForDb = globalThis as unknown as { __libraryDb?: Promise<Driver> };

async function connect(): Promise<Driver> {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  let driver: Driver;
  if (url) driver = await postgresDriver(url);
  else if (process.env.VERCEL) throw new DatabaseNotConfigured();
  else driver = await pgliteDriver();
  await driver.exec(SCHEMA);
  return driver;
}

function driver(): Promise<Driver> {
  globalForDb.__libraryDb ??= connect().catch((error) => {
    globalForDb.__libraryDb = undefined;
    throw error;
  });
  return globalForDb.__libraryDb;
}

/** Run a parameterised query and get its rows. */
export async function q<T extends Row = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  return (await driver()).query<T>(text, params);
}

/** The first row, or null. */
export async function one<T extends Row = Row>(text: string, params: unknown[] = []): Promise<T | null> {
  return (await q<T>(text, params))[0] ?? null;
}

export function newId(): string {
  return crypto.randomUUID();
}
