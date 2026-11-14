# LibHacks — Company Library

**Built.** This document was the build spec; see "As built" below for where the implementation differs.

---

## As built (14 Nov 2026)

| | |
|---|---|
| **Offices** | 74, from the supplied address table (`lib/offices.ts`): 10 each for Florham Park, New York (Madison Ave) and New York (Park Ave), 3 everywhere else |
| **Resources** | 243 (`lib/content.ts`), each tagged, with office, length, added date and external link |
| **Content model** | A shared catalogue of 118 real, linkable items (`lib/catalog.ts`). Each office's shelf is drawn from it by deterministic rotation: no office repeats a title, every office gets a book plus something to listen to or watch plus an article, and the three full shelves get ten |
| **Routes** | `/`, `/library`, `/offices`, `/offices/[slug]` (74 prerendered), 404 |
| **Theme** | `next-themes`, `defaultTheme="system"`, light/system/dark toggle; separate dark palette in `app/globals.css` |
| **Motion** | ReactBits `SplitText` (hero) and `SpotlightCard` (featured shelf), installed from the shadcn registry; Lenis smooth scroll driven by the GSAP ticker; reduced motion disables all of it |

**Deviations from the plan, and why**

- **Filter state uses `history.replaceState`, not `useSearchParams`.** Under Next 16 cache components, `useSearchParams` on a static route fails the production build unless wrapped in Suspense, and this page needs no server render of the query string. URL state is still shareable and the back button still works.
- **`dynamicParams` is not available.** Cache components rejects it at build time; unknown office slugs call `notFound()` instead (status 404, 404 UI).
- **The plan's 5-office assumption was wrong** — the real list is 74 offices, so the seed set grew from 29 resources to 243 and the catalog/pick model above replaced hand-listing every item per office.
- **shadcn and Vercel MCPs were not installed** from the build session (no tool configures the MCP client). The configs in §10 still apply; the build used the CLIs and the shadcn registry directly.

A public, sign-in-free library for a company: curated books, podcasts, videos and articles, tagged, with each office holding its own shelf of resources.

---

## 1. What we are building

| | |
|---|---|
| **Product** | "LibHacks" — a company library of recommendations |
| **Audience** | Anyone at the company, plus anyone with the link (no auth at all) |
| **Shape** | Marketing-ish home page → CTA → the actual library app |
| **Stack** | Next.js (App Router, TypeScript) + Tailwind v4 + shadcn/ui |
| **Motion** | Lenis (smooth scroll), GSAP (orchestrated reveals), ReactBits (text/card primitives) |
| **Theme** | Automatic dark/light from the OS, with a manual override |
| **Content** | 29 seeded resources across 5 offices, written by us in §11 |
| **Data** | Static TS data file. No DB, no API, no auth, no server actions |

### Requirements → where they land

| # | Requirement | Implementation |
|---|---|---|
| A | No sign-in, open to everyone | Zero auth. All pages statically rendered, no middleware, no user state |
| B | React + Next.js | Next.js App Router + React 19 + TS |
| C | Library of books, podcasts, videos, articles | `/library` with 4 media types, uniform card + type-specific metadata |
| D | Tagged | Tag vocabulary (§7), tag chips on every card, tag filter with counts, `/library?tag=ai` links |
| E | Offices have their own resources | `office` field on every resource, office filter, `/offices/[slug]` pages |
| F | Generated content: 3 per office, 10 for Florham Park + NYC | Full seed dataset in §11 (29 items), pasted verbatim into `lib/content.ts` |
| G | Good UI/UX, home page then CTA into the app | Home (`/`) with one CTA to `/library`; design system in §6 |
| H | `#3480eb` + `#eb9634` | Brand tokens in §6.2, used on the home page (subtle) and throughout the app |
| I | Automatic dark/light | `next-themes`, `defaultTheme="system"`, no flash, tri-state toggle |
| J | Lenis, GSAP, ReactBits | §8, with reduced-motion and cleanup rules |
| K | shadcn + Vercel MCPs | §10 — config is ready; both need a one-time action from you |
| L | Lock in | §12 gives an ordered task list so the build session is mechanical |
| M | Plan only | No files created except this one |
| N | Saved to a file | `PLAN.md` (this file) |

---

## 2. Assumptions to confirm before build

1. **Office list.** Only Florham Park and NYC were named. Plan uses five offices:
   **Florham Park (HQ)** 10 · **New York** 10 · **Chicago** 3 · **London** 3 · **Singapore** 3 = **29 resources**.
   All offices live in one array in `lib/offices.ts`; renaming or swapping cities is a 5-line edit.
2. **Company name.** Placeholder "the company" / wordmark "LibHacks". Easy rename in `lib/site.ts`.
3. **No saved-items / no personalization**, because A rules out identity. (A localStorage "saved" list is a possible follow-up, deliberately out of scope.)
4. **External links open in a new tab** and content lives on third-party sites (Goodreads, podcast pages, YouTube). We do not host or embed media.
5. **Deployment target is undecided** — the app is fully static and will work on Vercel or any static host. Deciding that is not part of this build.

---

## 3. Routes

```
/                          Marketing-style home → single CTA into the library
/library                   The app: search, filters, grid, sort
/offices                   All offices with counts + 2 preview cards each
/offices/[slug]            One office's shelf (same grid, office locked)
/not-found                 Friendly 404 with a way back to the library
```

Deliberately **no** `/library/[id]` route: resource detail (full blurb, tags, "open resource") opens in a `Dialog` from the card. One less page, no layout-shift navigation, and every resource stays shareable via the office pages + tag filters.

Filter state lives in the URL (`?q=&type=&tag=&office=&sort=`) via `useSearchParams` + `router.replace`, so any filtered view is shareable and the back button works.

---

## 4. File tree

```
app/
  layout.tsx                 fonts, ThemeProvider, LenisProvider, header/footer
  page.tsx                   home
  library/page.tsx           server shell → <LibraryExplorer resources={resources} offices={offices} tags={tags} />
  offices/page.tsx
  offices/[slug]/page.tsx    generateStaticParams over offices; 404 on unknown slug
  not-found.tsx
  globals.css                @theme tokens, base styles, focus ring, scrollbar
components/
  site-header.tsx            wordmark, nav, theme toggle, mobile sheet
  site-footer.tsx
  theme-provider.tsx         next-themes wrapper (client)
  theme-toggle.tsx           tri-state: light / system / dark (client)
  smooth-scroll-provider.tsx Lenis + GSAP ticker wiring (client)
  reveal.tsx                 GSAP ScrollTrigger reveal wrapper (client, reduced-motion aware)
  resource-card.tsx          card + catalog code + tags + type meta
  resource-dialog.tsx        detail dialog
  filter-bar.tsx             search input, type segmented control, tag multi-select, sort
  tag-chip.tsx               two variants: filter chip, meta chip
  office-strip.tsx           home + offices page: office shelves with counts
  library-explorer.tsx       client: state, filtering, sorting, empty state
  motion/split-text.tsx      ReactBits SplitText (JS-CSS variant)
  motion/spotlight-card.tsx  ReactBits SpotlightCard (JS-CSS variant)
  ui/…                       shadcn: button card badge input dialog sheet
                             dropdown-menu select tabs command tooltip skeleton separator
lib/
  site.ts                    name, tagline, nav
  offices.ts                 Office[] + helpers
  tags.ts                    tag vocabulary + labels + grouping
  content.ts                 Resource[] (the 29 items from §11) + derivation helpers
  filters.ts                 pure filter/sort/search functions (unit-testable, no React)
  utils.ts                   shadcn cn()
data/                        (empty; content lives in lib/content.ts for type safety)
public/                      favicon, og image (static, generated once)
```

---

## 5. Data model

```ts
export type MediaType = "book" | "podcast" | "video" | "article";

export type TagId =
  | "leadership" | "strategy" | "product" | "engineering" | "design"
  | "ai" | "data" | "finance" | "sales" | "customer"
  | "communication" | "culture" | "career" | "craft"
  | "wellbeing" | "security" | "operations" | "storytelling";

export interface Office {
  slug: string;        // "florham-park"
  name: string;        // "Florham Park"
  region: string;      // "New Jersey, US"
  code: string;        // "FP" — used in catalog codes
  blurb: string;       // one line, shown on /offices
}

export interface Resource {
  id: string;             // "fp-03-thinking-in-systems"
  title: string;
  creator: string;        // author / host / channel
  type: MediaType;
  office: string;         // Office["slug"] | "all"  (company-wide shelf)
  tags: TagId[];          // 2–3 each
  blurb: string;          // one sentence, why it's here
  url: string;            // canonical external link
  length: string;         // "6h read" | "54 min" | "18 min watch"
  featured?: boolean;     // 3 across the whole library, shown on home
  addedAt: string;        // ISO date, drives default "Newest" sort
}
```

Catalog code is derived, not stored: `FP · BK · 03` from office code + type + index. It is real information (which shelf, which medium), which is why it earns its place in the design instead of being decoration.

Helpers in `lib/content.ts`: `allTagsWithCounts()`, `resourcesByOffice()`, `featured()`, `mediaTypeCounts()`, `relatedTo(resource)` (shares ≥ 2 tags, max 3). Helpers in `lib/filters.ts` are pure functions taking `(resources, filters)` so the filtering logic is testable without rendering.

---

## 6. Design

### 6.1 Concept: the reading room, not the dashboard

The subject is a library, so the design language is **catalog card + shelf**, not SaaS cards. Concretely:

- **Catalog codes and shelf rules carry the structure.** Hairline rules under resource rows, mono catalog codes, office shelf headers — information-bearing, quiet.
- **The memorable moment is spent in one place:** the home hero. A typographic stack that assembles like books being shelved (masked line reveal, one GSAP timeline), with the brand orange used exactly once as a "new arrival" bookmark ribbon.
- **Everything else is disciplined:** flat surfaces, 1px borders, two radii (6px controls, 2px cards — cards are index cards, not pillows), no gradient washes, no shadow-on-every-card.
- **Type does the personality.** Fraunces (display, optical sizing, slightly wonky serif) + IBM Plex Sans (body/UI) + IBM Plex Mono (catalog codes, counts, lengths). One superfamily plus one display face — no third family.
- Line length capped at ~72ch. Left-aligned body. Numbers and lengths in mono so columns line up.
- **No all-caps eyebrow labels, no "01 / 02 / 03" numbering, no arrow appended to every link.** Office names and catalog codes are the only uppercase-ish metadata, and they're set in mono at small size with normal tracking.

### 6.2 Color tokens (Tailwind v4 `@theme` in `globals.css`)

Brand: `#3480eb` (blue) and `#eb9634` (orange). Blue = interaction. Orange = the "new / featured" marker and the one home-page ribbon. Orange at `#eb9634` on white is ~2.3:1, so it is **never** used for body text on light surfaces — only as a fill with ink text, a 4px rule, or a chip border.

```css
:root {
  --bg:        #F6F7F9;   /* page */
  --surface:   #FFFFFF;   /* cards, header */
  --surface-2: #EFF1F4;   /* inputs, wells */
  --ink:       #131820;   /* primary text */
  --ink-muted: #5C6672;   /* secondary text (>= 4.5:1 on --bg) */
  --line:      #E1E5EA;
  --brand:     #3480eb;   /* links, active states, focus */
  --brand-ink: #1E5FC0;   /* brand as text on light */
  --accent:    #eb9634;   /* ribbon, featured marker, fills only */
  --accent-ink:#8A4E0C;   /* accent as text on light */
}
.dark {
  --bg:        #0C1015;
  --surface:   #131922;
  --surface-2: #1A2230;
  --ink:       #EDF1F6;
  --ink-muted: #99A4B3;
  --line:      #242E3B;
  --brand:     #6BA4F5;   /* lifted for dark contrast */
  --brand-ink: #9CC2FA;
  --accent:    #F0A652;
  --accent-ink:#F7C083;
}
```

Media-type encoding uses the two brand hues plus neutrals, not a rainbow: **book** = solid ink chip, **podcast** = orange outline, **video** = blue outline, **article** = neutral outline. Type is also in the catalog code, so color is never the only signal (color-blind safe).

### 6.3 Home page layout

```
┌──────────────────────────────────────────────────────────────┐
│ LibHacks        Library  Offices                 ◐ theme   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  A company library,                     ┌─────────────────┐  │
│  kept by everyone.                      │  newest arrival │  │
│  ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔                        │  (orange ribbon)│  │
│  Books, podcasts, talks and articles    │  Thinking in    │  │
│  our offices actually recommend.        │  Systems        │  │
│                                         │  FP · BK · 01   │  │
│  [ Open the library → ]  29 resources   └─────────────────┘  │
│  ────────────────────────────────────────────────────────    │
│  29 titles · 5 offices · 18 tags                             │
├──────────────────────────────────────────────────────────────┤
│  What's inside      ┌────┐ ┌────┐ ┌────┐ ┌────┐              │
│                     │book│ │pod │ │vid │ │art │  counts      │
├──────────────────────────────────────────────────────────────┤
│  On the shelf this week            (3 featured cards)         │
├──────────────────────────────────────────────────────────────┤
│  Find your office    FP 10 · NY 10 · CHI 3 · LDN 3 · SGP 3   │
├──────────────────────────────────────────────────────────────┤
│  A small footer: "Anyone with the link can read." + nav      │
└──────────────────────────────────────────────────────────────┘
```

The **only** CTA on the home page is `Open the library` (primary, blue). The featured cards are links too, but nothing competes visually with the CTA.

### 6.4 Library page layout

```
┌──────────────────────────────────────────────────────────────┐
│ LibHacks        Library  Offices                 ◐ theme   │
├──────────────────────────────────────────────────────────────┤
│ Library                                   29 resources        │
│ Everything the company recommends, tagged and sorted.        │
│                                                              │
│ [ search titles, creators, tags…        ]  [ Newest ▾ ]      │
│ All 29 · Books 6 · Podcasts 6 · Videos 5 · Articles 6        │
│ Office: All · FP · New York · Chicago · London · Singapore   │
│ Tags:  ai 5  leadership 6  design 4  …  (wrap, with counts)   │
├──────────────────────────────────────────────────────────────┤
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐        │
│ │ FP · BK · 01  │ │ NY · PD · 03  │ │ …             │        │
│ │ Thinking in   │ │ 99% Invisible │ │               │        │
│ │ Systems       │ │               │ │               │        │
│ │ Donella Meadows│ │ Roman Mars    │ │               │        │
│ │ 6h read       │ │ ongoing       │ │               │        │
│ │ #systems #ops │ │ #design #craft│ │               │        │
│ └───────────────┘ └───────────────┘ └───────────────┘        │
│  (1 / 2 / 3 columns; 3 → 2 → 1 across breakpoints)           │
└──────────────────────────────────────────────────────────────┘
```

- Grid is 3-up at ≥1024px, 2-up at ≥640px, 1-up on mobile. Max width 1120px, 24px gutters on mobile.
- **Empty state** is directional, not sad: "Nothing matches `deep work` in London. [Clear filters]" plus three nearby suggestions from other offices.
- **Filter chips** are `aria-pressed` buttons, not fake links; the tag row scrolls horizontally on mobile with a fade mask. Active filters render as a removable row above the grid (`3 filters · Clear all`).
- Result count is `aria-live="polite"` and announced as `aria-label` on the grid region.
- Every card is one big link target for "open resource" inside the dialog; the dialog itself is keyboard-trapped by shadcn `Dialog` and restores focus on close.

### 6.5 Office page

Header with office name, region, count, one-line blurb; then the same grid with office locked, plus "Company-wide picks" (resources with `office: "all"` if we add any) — or, simpler, 3 "Elsewhere in the library" cross-links so single-office pages don't feel like dead ends.

### 6.6 What would make this look generated (and we are not doing)

Cream background + terracotta accent, gradient mesh blobs, identical rounded cards with the same soft shadow, a tracked-out ALL-CAPS eyebrow above every section, "01/02/03" stepping where nothing is sequential, an arrow appended to every label, dark mode that's just inverted grey. Dark mode here is a separately tuned palette, not an inversion.

---

## 7. Tags

18 tags, always shown with counts, always lowercase in UI, always title-cased in the accessible label.

`ai` · `leadership` · `strategy` · `product` · `engineering` · `design` · `craft` · `data` · `security` · `finance` · `sales` · `customer` · `operations` · `communication` · `culture` · `career` · `wellbeing` · `storytelling`

Rules: 2–3 tags per resource, at least one cross-office tag so filters never return a single item. Tag filter is multi-select with OR semantics (matches any selected tag), combined with type/office/search via AND. `lib/filters.ts` documents this in a comment because it is the one behaviour that will otherwise be argued about.

---

## 8. Motion: Lenis + GSAP + ReactBits

**One orchestrated sequence, everything else quiet.** Motion answers interaction; it does not decorate scroll.

| Where | What | Library |
|---|---|---|
| Page scroll | Lenis smooth scroll, `lerp: 0.1`, autoRaf off (driven by GSAP ticker) | `lenis` |
| Home hero, on mount | Masked line-by-line reveal of the headline, then subhead, then CTA — one `gsap.timeline`, ~0.9s total, `power3.out`, 0.08 stagger | ReactBits `SplitText` (JS-CSS) |
| Home sections, on scroll | Single `ScrollTrigger` batch reveal (y: 16, opacity 0 → 1), once per section | custom `reveal.tsx` |
| Featured cards, hover | Cursor-follow spotlight on the book-plate card only | ReactBits `SpotlightCard` (JS-CSS) |
| Library | **No** scroll animation. Card hover = 120ms border/brand shift; filter changes animate via CSS only | — |
| Theme switch | 160ms color transition on `--bg`/`--ink` only, no flash | CSS |

Rules:
- `prefers-reduced-motion: reduce` → Lenis is never constructed, GSAP timelines resolve instantly to final state via `gsap.set`, spotlight disabled. One hook (`usePrefersReducedMotion`) gates all of it; this is an acceptance criterion, not a nicety.
- All GSAP contexts are `gsap.context(...)` scoped to a ref and `revert()`ed on unmount; `ScrollTrigger.refresh()` after fonts load.
- Lenis is created once in a client provider, destroyed on unmount, and skipped on `/library` scroll containers (the tag row keeps native scroll).
- No animation may delay first contentful paint: hero text is real text in the DOM, revealed by transform/opacity only, never injected after mount.
- Hard budget: GSAP + Lenis + ReactBits ≈ 60–70 kB gzipped, loaded only on routes that use them (`next/dynamic` for the hero and spotlight). If bundle check exceeds budget, drop spotlight first, then SplitText, keep Lenis.

---

## 9. Theming (automatic dark/light)

- `next-themes` with `attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`.
- `suppressHydrationWarning` on `<html>`; block `<script>` from next-themes prevents flash.
- Toggle is a 3-state control (Light · System · Dark) in a shadcn `DropdownMenu`, showing the current resolved state and a `title` that names it. System is the default and is visibly labelled, so "automatic" is a real state, not a hidden fallback.
- `<meta name="theme-color">` set for both schemes via two `media`-scoped tags.
- No `color-scheme` mismatch on form controls: `:root { color-scheme: light }`, `.dark { color-scheme: dark }`.
- Images/OG card stay theme-neutral (no white-on-transparent logo).

---

## 10. MCPs (shadcn, Vercel) — what I can and can't do

I can't add MCP servers to your Freebuff session from here: MCP clients are configured outside the project, and this session has no tool that edits that config. So this is a **two-minute action for you**, once, before the build:

**In Freebuff Desktop, the project file is the practical route.** This repo now has `.agents/mcp.json` with both servers in the standard `mcpServers` shape; Freebuff reads it from the project root and asks once whether to load and run the directory. Desktop 0.0.201 is missing the Settings → MCP panel, so the project file (or the `freebuff` CLI) is the only way in on that build. MCP tools load when a chat starts, so a fresh chat after approving is needed.

**shadcn MCP** (local stdio, no auth). Either run the init, or add the snippet:

```bash
npx shadcn@latest mcp init --client <claude|cursor|vscode|codex|opencode>
```

```json
{ "mcpServers": { "shadcn": { "command": "npx", "args": ["shadcn@latest", "mcp"] } } }
```

```toml
# ~/.codex/config.toml
[mcp_servers.shadcn]
command = "npx"
args = ["shadcn@latest", "mcp"]
```

It lets the build session browse/search/install registry items instead of writing components from memory — including ReactBits, which now publishes through the shadcn registry (`npx shadcn@latest add @react-bits/SplitText-JS-CSS`).

**Vercel MCP** (remote, OAuth, `mcp.vercel.com`):

```bash
npx add-mcp mcp.vercel.com        # detects clients, writes config
# or
vercel mcp
```

Vercel MCP only does something useful once there's a Vercel project + your sign-in, so it matters at deploy time, not at build time. If you don't deploy to Vercel, it's optional. If either MCP can't be added, the build proceeds exactly as planned — shadcn CLI, ReactBits CLI and `next` cover everything; the MCPs are convenience, not a dependency.

Also worth knowing: `components.json` will be created so the shadcn registry (and ReactBits) resolve correctly.

---

## 11. Seed content (29 resources, generated now)

Paste into `lib/content.ts` verbatim, then link-check every `url` during the build (§13). Where a specific deep link is uncertain, the link points at the canonical show/channel/site page rather than an invented episode/video ID.

### Florham Park — HQ (10)

| # | Title | Creator | Type | Tags | Length | Link |
|---|---|---|---|---|---|---|
| 1 | Thinking in Systems | Donella Meadows | book | operations, strategy | 6h read | goodreads.com/search?q=thinking+in+systems |
| 2 | The Making of a Manager | Julie Zhuo | book | leadership, career | 5h read | goodreads.com/search?q=the+making+of+a+manager |
| 3 | Radical Candor | Kim Scott | book | communication, leadership | 7h read | goodreads.com/search?q=radical+candor |
| 4 | How to Do Great Work | Paul Graham | article | career, craft | 25 min read | paulgraham.com/greatwork.html |
| 5 | The Feedback Fallacy | Marcus Buckingham & Ashley Goodall (HBR) | article | leadership, communication | 18 min read | hbr.org/2019/03/the-feedback-fallacy |
| 6 | The Only Thing That Matters | Marc Andreessen | article | strategy, product | 12 min read | pmarchive.com/guide_to_startups_part4.html |
| 7 | Acquired — Nike | Ben Gilbert & David Rosenthal | podcast | strategy, storytelling | 3h listen | acquired.fm/episodes/nike |
| 8 | Lenny's Podcast | Lenny Rachitsky | podcast | product, career | ongoing | lennyspodcast.com |
| 9 | How to Speak | Patrick Winston (MIT OCW) | video | communication, craft | 63 min watch | youtube.com/watch?v=Unzc731iCUY |
| 10 | 100+ Computer Science Concepts Explained | Fireship | video | engineering, craft | 13 min watch | youtube.com/watch?v=-uleG_Vecis |

### New York (10)

| # | Title | Creator | Type | Tags | Length | Link |
|---|---|---|---|---|---|---|
| 11 | The Creative Act | Rick Rubin | book | craft, culture | 7h read | goodreads.com/search?q=the+creative+act |
| 12 | Designing Data-Intensive Applications | Martin Kleppmann | book | engineering, data | 20h read | goodreads.com/search?q=designing+data-intensive+applications |
| 13 | Never Split the Difference | Chris Voss | book | sales, communication | 8h read | goodreads.com/search?q=never+split+the+difference |
| 14 | Maker's Schedule, Manager's Schedule | Paul Graham | article | operations, culture | 8 min read | paulgraham.com/makersschedule.html |
| 15 | Netflix Culture | Netflix | article | culture, leadership | 20 min read | jobs.netflix.com/culture |
| 16 | 99% Invisible | Roman Mars | podcast | design, storytelling | ongoing | 99percentinvisible.org |
| 17 | The Daily | The New York Times | podcast | culture, strategy | 20 min listen | nytimes.com/column/the-daily |
| 18 | How I Built This | Guy Raz | podcast | strategy, career | ongoing | wondery.com/shows/how-i-built-this |
| 19 | The Art of Code | Dylan Beattie (NDC) | video | craft, engineering | 60 min watch | youtube.com/watch?v=6avJHaC3C2U |
| 20 | Steve Jobs' Stanford Commencement | Steve Jobs | video | career, storytelling | 15 min watch | youtube.com/watch?v=UF8uR6Z6KLc |

### Chicago (3)

| # | Title | Creator | Type | Tags | Length | Link |
|---|---|---|---|---|---|---|
| 21 | Deep Work | Cal Newport | book | career, craft | 8h read | goodreads.com/search?q=deep+work |
| 22 | The Changelog | Changelog Media | podcast | engineering, culture | ongoing | changelog.com/podcast |
| 23 | The Twelve-Factor App | Adam Wiggins | article | engineering, operations | 20 min read | 12factor.net |

### London (3)

| # | Title | Creator | Type | Tags | Length | Link |
|---|---|---|---|---|---|---|
| 24 | The Culture Map | Erin Meyer | book | culture, communication | 8h read | goodreads.com/search?q=the+culture+map |
| 25 | The Economist Podcasts | The Economist | podcast | strategy, finance | ongoing | economist.com/audio/podcasts |
| 26 | Do Things That Don't Scale | Paul Graham | article | strategy, customer | 15 min read | paulgraham.com/ds.html |

### Singapore (3)

| # | Title | Creator | Type | Tags | Length | Link |
|---|---|---|---|---|---|---|
| 27 | Poor Charlie's Almanack | Charles T. Munger | book | strategy, finance | 12h read | goodreads.com/search?q=poor+charlie%27s+almanack |
| 28 | How Great Leaders Inspire Action | Simon Sinek (TED) | video | leadership, communication | 18 min watch | ted.com/talks/simon_sinek_how_great_leaders_inspire_action |
| 29 | The Batch | DeepLearning.AI | article | ai, data | weekly read | deeplearning.ai/the-batch |

Coverage check: 6 books, 6 podcasts, 5 videos, 6 articles — every type appears in the library's default view, and every office has at least one book, so no filter combination strands a user. Company-wide `office: "all"` shelf stays empty for v1 (structure supports it if you want a shared shelf later); `featured: true` on #1, #10 and #11 gives the home page its three cards.

**Blurbs** (one sentence each, drafted to sound like a colleague, not a catalog): e.g. #1 "The book that makes org charts stop looking like mysteries and start looking like feedback loops." #10 "The fastest way to close the gaps in your CS vocabulary before the next architecture conversation." Write all 29 in this voice during the build, matching the 2 examples.

---

## 12. Build order (the "lock in" list)

Each step is independently shippable and verifiable.

1. **Scaffold** — `create-next-app` (TS, App Router, Tailwind, `app/` dir, no src dir, alias `@/*`) → `shadcn init` → add `button card badge input dialog sheet dropdown-menu select tabs command tooltip skeleton separator`. `components.json` created here.
2. **Foundations** — `lib/site.ts`, `lib/offices.ts`, `lib/tags.ts`; fonts via `next/font` (Fraunces, IBM Plex Sans, IBM Plex Mono); `@theme` tokens from §6.2; base styles, focus ring; layout shell with header/footer and skip link.
3. **Theme** — `ThemeProvider`, no-flash script, tri-state toggle, both theme-color metas. Verify by toggling OS setting while the page is open.
4. **Content** — `lib/content.ts` with all 29 resources + blurbs + `featured`; `lib/filters.ts` pure functions; link-check all 29 URLs and fix the bad ones.
5. **Library app** — `library-explorer.tsx`, `filter-bar.tsx`, `resource-card.tsx`, `resource-dialog.tsx`, `tag-chip.tsx`, URL state, empty state, `aria-live` count. This is the core; do it before the home page so the design system gets tested against real density.
6. **Home** — hero + CTA, type counts, featured trio, office strip, footer note. Add Lenis + GSAP + ReactBits here only.
7. **Offices** — index and `[slug]` pages via `generateStaticParams`, plus cross-links.
8. **Polish & audit** — responsive sweep at 375/768/1024/1440, keyboard-only pass, reduced-motion pass, Lighthouse on `/` and `/library`, bundle check against the §8 budget.
9. **Ship** — decided separately; static export or platform deploy, not part of this plan.

---

## 13. Verification plan (for the build session)

- `next build` and `tsc --noEmit` clean; no `any` in `lib/`.
- All five routes render at 200; unknown office slug 404s.
- All 29 `url` values return 200 (script the check once, then delete the script or keep it as `scripts/check-links.mjs`).
- Filter logic covered by a handful of pure-function assertions in `lib/filters.ts` (office+type+search+multi-tag, empty result, sort order) — the only logic here worth testing.
- Manual, once: OS dark ↔ light with the page open (no flash), reduced-motion on (no timeline, Lenis absent), keyboard tab through header → filters → first card → dialog → close, 375px width.
- Explicitly not claimed until seen: visual polish on real devices.

---

## 14. Risks

| Risk | Handling |
|---|---|
| Invented/rotted external URLs | Canonical show/channel/site pages instead of deep links; link check in step 4; `rel="noopener noreferrer"` + "opens in a new tab" via `aria-label` |
| Orange fails contrast as text | Token discipline: `--accent` is fill-only, `--accent-ink` for text |
| Motion hurts accessibility/perf | Gated by one hook, dynamic-imported, Lenis driven by GSAP's ticker, budgeted at ~70 kB |
| Unconfirmed office list | One array, 5-line edit; content already balanced per office |
| Scope creep (saved items, admin, CMS, auth) | Out of scope by A/M; noted as follow-ups only |
| Debugging GSAP/Lenis ordering | Lenis raf driven by `gsap.ticker`; `ScrollTrigger.refresh()` after fonts settle |

---

## 15. Definition of done

- Home loads with one obvious CTA into `/library`.
- `/library` shows 29 tagged resources, searchable and filterable by type, office and multiple tags, state shareable via URL.
- Each of the 5 offices has its own page with its own resources (10 / 10 / 3 / 3 / 3).
- Both brand colors appear meaningfully and accessibly; light and dark both look deliberate, driven by the OS by default.
- Lenis, GSAP and ReactBits are present and respect reduced motion; no jank on filter changes.
- No sign-in, no cookies, no tracking, no backend.
- `PLAN.md` matches what was built, or was updated where it changed.
