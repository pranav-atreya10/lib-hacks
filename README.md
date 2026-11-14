# LibHacks

A company library of book recommendations, podcasts, videos and articles — tagged, filterable, and kept per office. No sign-in: anyone with the link can read it.

- `/` — landing page with a single call to action
- `/library` — 243 tagged resources, searchable and filterable by type, office and tag
- `/offices` — all 74 offices; each has its own shelf (`/offices/[slug]`)

## Run it

```bash
npm install
npm run dev
```

Build and serve the production output:

```bash
npm run build
npm run start
```

## Where things live

- `lib/catalog.ts` — the curated catalogue of real resources
- `lib/content.ts` — per-office shelves built from the catalogue
- `lib/offices.ts` — the 74 offices, addresses and catalog codes
- `lib/tags.ts` — the tag vocabulary
- `app/globals.css` — design tokens, light and dark
- `PLAN.md` — the build spec and an "as built" note
