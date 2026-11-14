import type { MediaType, CatalogItem } from "@/lib/catalog";

/** Deterministic cover art per catalogue item. */
export function itemThumb(
  item: CatalogItem,
  {
    width = 480,
    height = 480,
    outline = false,
  }: { width?: number; height?: number; outline?: boolean } = {},
): string {
  const letters = item.slug
    .replace(/[-_]+[^a-zA-Z0-9]/g, "")
    .trim()
    .split(/(?=[A-Z])/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s.charAt(0));

  function initial() {
    if (letters.length >= 2) return letters[0] + letters[1];
    if (item.creator) {
      const parts = item.creator.split(/\s+/);
      return (parts[0]?.[0] ?? "X") + (parts[1]?.[0] ?? "");
    }
    if (item.title) {
      const words = item.title.split(/\s+/);
      return (words[0]?.[0] ?? "X") + (words[1]?.[0] ?? "");
    }
    return "XX";
  }

  const initials = initial().toUpperCase();
  const palette = THEMES[item.type];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 480 480" role="img" aria-label="${escapeAttr(item.title)} cover">
  <title>${escapeAttr(item.title)} cover from ${escapeAttr(item.creator)}</title>
  <defs>
    <linearGradient id="g-${safeId(item.slug)}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${palette.bg}"/>
      <stop offset="1" stop-color="${palette.bg2}"/>
    </linearGradient>
    <linearGradient id="ts-${safeId(item.slug)}-${palette.id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${palette.text}" stop-opacity="0.85"/>
      <stop offset="1" stop-color="${palette.text}" stop-opacity="0.18"/>
    </linearGradient>
    ${outline
      ? ""
      : `<clipPath id="cf-${safeId(item.slug)}"><rect x="16" y="16" width="${480-32}" height="${480-32}" rx="${36}" fill="none"/></clipPath>`}
  </defs>

  ${outline
    ? `<rect x="0" y="0" width="480" height="480" fill="none" stroke="${palette.outline}" stroke-width="4" rx="40"/>`
    : `<rect x="0" y="0" width="480" height="480" fill="url(#g-${safeId(item.slug)})" rx="40"/>`
  }

  <g ${!outline ? `clip-path="url(#cf-${safeId(item.slug)})"` : ""}>
    <rect x="0" y="250" width="480" height="230" fill="url(#ts-${safeId(item.slug)}-${palette.id})" opacity="0.9"/>

    <circle cx="${240}" cy="${150}" r="120" fill="${palette.contrast}" opacity="0.14"/>
    <circle cx="${240}" cy="${150}" r="56" fill="${palette.contrast}" opacity="0.28"/>
    <circle cx="${240}" cy="${150}" r="20" fill="${palette.contrast}" opacity="0.85"/>

    <g text-rendering="geometricPrecision" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif">
      <text x="240" y="326" text-anchor="middle" font-weight="600" font-size="74" letter-spacing="-4" fill="#16171c">${initials}</text>
    </g>

    <text x="24" y="442" text-anchor="start" fill="${palette.text}" font-weight="600" font-size="22" letter-spacing="3">${palette.kicker}</text>
    <text x="24" y="466" text-anchor="start" fill="${palette.text}" opacity="0.75" font-size="16" letter-spacing="1" font-weight="600">${escapeAttr("Inspire, Engage, Innovate.")}</text>
  </g>
</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

type Theme = {
  bg: string;
  bg2: string;
  text: string;
  contrast: string;
  id: string;
  kicker: string;
  outline: string;
};

const THEMES: Record<MediaType, Theme> = {
  book: {
    bg: "#1b4481",
    bg2: "#113262",
    text: "#ffffff",
    contrast: "#88b6ff",
    id: "b",
    kicker: "BOOK",
    outline: "#0f2c56",
  },
  podcast: {
    bg: "#4a4a55",
    bg2: "#31313c",
    text: "#ffffff",
    contrast: "#bfbfc9",
    id: "p",
    kicker: "PODCAST",
    outline: "#22222b",
  },
  video: {
    bg: "#c7501f",
    bg2: "#9f3f18",
    text: "#ffffff",
    contrast: "#ffb38d",
    id: "v",
    kicker: "WATCH",
    outline: "#833113",
  },
  article: {
    bg: "#6a5a3a",
    bg2: "#54492e",
    text: "#fbf4df",
    contrast: "#ecd9a6",
    id: "a",
    kicker: "READ",
    outline: "#443d24",
  },
};

function safeId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 48);
}

function escapeAttr(value: string): string {
  return value.replace(/[&<>"']/g, (c) =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&apos;",
    }[c]!),
  );
}
