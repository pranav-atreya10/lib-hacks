# Infinite Library

**Inspire. Engage. Innovate.** A company library of books, podcasts, videos and articles — tagged, kept by 74 office folders plus one company-wide shelf, and ranked differently for every person who opens it. No sign-in.

- `/` — landing page: name, purpose, and the judges' call to action (plus "Take the tour")
- `/library` — who's reading, the "Hey, did you know…" dashboard, office folders (the six people's offices first), then the company-wide shelf only
- `/offices/[slug]` — one office's folder; people who work there can recommend to it and tag any file in it
- `/people/[id]` — a person's ranked shelf and their "Outside your bubble" picks

## People and permissions

- **Visitor** (the default) is view only: browse, open files, read reviews.
- **Maya, Jonah, Aarav, Amara, Diego, Hana** can like, review, recommend files to their own office, and add tags to any file in their own office.
- Likes, reviews and views from everyone feed the rankings. Everything is saved in the browser (`localStorage`).

## Covers

Every card shows a generated typographic cover at once, then fades in the real one when it loads (`components/cover.tsx`):

- YouTube links → the video still, straight from YouTube
- Books → Open Library, then Google Books (by title and author)
- Podcasts → Apple Podcasts artwork
- Everything else → the page's own `og:image`

Lookups run in `app/api/thumbnail/route.ts` (cached for weeks, misses for hours). The recommend form uses the same route to show a cover preview and fill in the title from the link.

## Guided tour

First visit to `/library` (or "Take the tour") starts a spotlight tour of the people, dashboard, office folders, recommending, file types, tags, likes/reviews/views and "Outside your bubble" (`components/tour.tsx`).

## Design skills

`.claude/skills/` holds the design skills used for the UI pass: `emil-design-eng` (Emil Kowalski), `impeccable`, `taste-skill` and `ui-ux-pro-max`. Large photo assets, the impeccable launcher binary and taste-skill's auto-run hook were left out.

## Where things live

- `lib/catalog.ts` — the curated catalogue of real resources
- `lib/content.ts` — the company shelf and per-office shelves built from the catalogue
- `lib/personas.ts`, `lib/personalize.ts` — the six people and the ranking
- `lib/covers.ts`, `lib/cover-lookup.ts`, `lib/cover-art.ts` — cover finding and generated covers
- `components/library-state.tsx` — who's reading, likes, reviews, views, recommendations, tags
- `app/globals.css` — design tokens, light and dark, motion utilities
