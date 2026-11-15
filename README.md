# Infinite Library

**Inspire. Engage. Innovate.** The learning library for companies.

A company subscribes; inside it, anyone can start a **library** (like a group chat for reading) for their team, practice, office or a topic. Libraries overlap and people can be in as many as they like. Library admins are the team leads: they see insights about their members, coach them, assign reads and pick a monthly giveaway winner.

## What's in it

- **Accounts**: email and password (scrypt-hashed, session cookie), locked for 15 minutes after 5 wrong passwords (and per-connection limits). SSO buttons point to sales (Enterprise).
- **Companies**: the first person creates the workspace and becomes its admin. People join with an invite link (instant), or by signing up with the company's claimed work-email domain, which sends a join request the admin approves.
- **Onboarding**: pick interests, like a few things, and (for the creator) stock the company-wide library.
- **Libraries**: open or private; every company has an "Everyone at …" library. Members recommend files (with automatic covers); library admins add marketplace collections and manage members.
- **Marketplace**: topic collections of real books, talks, podcasts and articles, and templates for new libraries.
- **Trends**: activity over time, topics rising and quiet, popular files, active libraries, top contributors (admins).
- **Team insights** (library admins): per-person reads, likes, reviews, topics, blind spots, coaching prompts, notes, assigned reads that complete themselves, and the monthly giveaway.
- **Transparency**: everyone can see, on their profile, exactly what their library admins see about them.
- **Company admin**: name, join-by-domain, invite links, roles, plan, CSV export of activity.
- **Pricing**: Starter free; Team and Enterprise go to "Talk to sales".

## Database

- On Vercel set `DATABASE_URL` (or `POSTGRES_URL`) to a Postgres database — e.g. Neon from the Vercel Marketplace. Tables are created automatically on first use.
- Locally, with no `DATABASE_URL`, it uses PGlite (Postgres in-process) saved to `.data/`.

## Develop and test

```bash
npm run dev
```

```bash
npm run test:e2e
```

Set `PLAYWRIGHT_CHROMIUM_PATH` to use an already-installed Chromium.

## Where things live

- `lib/db.ts` — database connection and schema
- `lib/auth.ts` — passwords, sessions, the signed-in viewer
- `app/actions.ts` — every change (server actions), with permission checks
- `lib/library.ts`, `lib/team.ts`, `lib/insights.ts` — reading data, coaching data, rankings and insights
- `lib/marketplace.ts`, `lib/catalog.ts` — collections, templates and the real catalogue
- `app/(site)` public pages · `app/(auth)` sign-in and onboarding · `app/app` the product
