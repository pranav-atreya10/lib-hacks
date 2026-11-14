import type { MediaType } from "./catalog";
import { hash32 } from "./engagement";

/**
 * A generated cover for when no real image exists (or while one loads).
 * Typographic on purpose: the title is the cover. Each medium has its own
 * family of colours and each title nudges the hue, so a shelf never looks
 * like a row of identical tiles.
 */

interface Palette {
  hue: number;
  sat: number;
  light: number;
  label: string;
}

const PALETTES: Record<MediaType, Palette> = {
  book: { hue: 214, sat: 38, light: 26, label: "BOOK" },
  podcast: { hue: 282, sat: 24, light: 27, label: "PODCAST" },
  video: { hue: 14, sat: 52, light: 36, label: "VIDEO" },
  article: { hue: 42, sat: 26, light: 30, label: "ARTICLE" },
};

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (char) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]!,
  );
}

/** Greedy word wrap, with an ellipsis if the title runs past maxLines. */
export function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars || !current) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = `${kept[maxLines - 1].replace(/[\s,.:;–-]+$/, "")}…`;
  return kept;
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%)`;
}

export interface CoverArtInput {
  slug: string;
  title: string;
  creator: string;
  type: MediaType;
}

/** Colours for a file, shared by the SVG and the frame around a real cover. */
export function coverColors(item: CoverArtInput) {
  const base = PALETTES[item.type];
  const seed = hash32(item.slug || item.title);
  const hue = base.hue + ((seed % 31) - 15);
  return {
    bg: hsl(hue, base.sat, base.light),
    bgDeep: hsl(hue, base.sat + 4, base.light - 9),
    accent: hsl(hue + 8, base.sat + 18, base.light + 44),
    ink: "#fbfaf7",
  };
}

export function generatedCover(item: CoverArtInput): string {
  const base = PALETTES[item.type];
  const colors = coverColors(item);
  const seed = hash32(item.slug || item.title);
  const id = `c${seed.toString(36)}`;
  const title = item.title || "Untitled";
  const creator = item.creator || "";

  let body: string;

  if (item.type === "book") {
    // A standing book: spine, cover, title set inside it.
    const lines = wrap(title, 13, 4);
    const size = lines.length > 3 ? 19 : 22;
    const startY = 148 - ((lines.length - 1) * (size + 4)) / 2;
    body = `
  <rect x="0" y="0" width="640" height="360" fill="url(#${id}-bg)"/>
  <ellipse cx="320" cy="322" rx="120" ry="10" fill="#000" opacity="0.28"/>
  <g>
    <rect x="236" y="40" width="168" height="280" rx="4" fill="${colors.bgDeep}"/>
    <rect x="236" y="40" width="168" height="280" rx="4" fill="url(#${id}-sheen)"/>
    <rect x="236" y="40" width="12" height="280" fill="#000" opacity="0.22"/>
    <rect x="260" y="62" width="122" height="1.5" fill="${colors.accent}" opacity="0.7"/>
    <rect x="260" y="296" width="122" height="1.5" fill="${colors.accent}" opacity="0.7"/>
    ${lines
      .map(
        (line, index) =>
          `<text x="324" y="${startY + index * (size + 4)}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${size}" fill="${colors.ink}">${escapeXml(line)}</text>`,
      )
      .join("\n    ")}
    <text x="324" y="282" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="11" letter-spacing="1.5" fill="${colors.accent}">${escapeXml(wrap(creator.toUpperCase(), 22, 1)[0] ?? "")}</text>
  </g>`;
  } else {
    const lines = wrap(title, 24, 3);
    const size = lines.length > 2 ? 34 : 40;
    const lineHeight = size * 1.12;
    const blockTop = 196 - (lines.length - 1) * lineHeight;
    const motif =
      item.type === "podcast"
        ? `<g fill="none" stroke="${colors.accent}" opacity="0.5" stroke-width="2"><circle cx="540" cy="92" r="22"/><circle cx="540" cy="92" r="40"/><circle cx="540" cy="92" r="58" opacity="0.6"/></g><circle cx="540" cy="92" r="7" fill="${colors.accent}"/>`
        : item.type === "video"
          ? `<circle cx="540" cy="92" r="40" fill="${colors.accent}" opacity="0.18"/><path d="M528 72 L560 92 L528 112 Z" fill="${colors.accent}" opacity="0.9"/>`
          : `<g fill="${colors.accent}" opacity="0.55"><rect x="498" y="66" width="84" height="5" rx="2.5"/><rect x="498" y="82" width="84" height="5" rx="2.5"/><rect x="498" y="98" width="60" height="5" rx="2.5"/><rect x="498" y="114" width="72" height="5" rx="2.5"/></g>`;
    body = `
  <rect x="0" y="0" width="640" height="360" fill="url(#${id}-bg)"/>
  ${motif}
  <text x="48" y="74" font-family="ui-sans-serif, system-ui, sans-serif" font-size="13" font-weight="600" letter-spacing="3" fill="${colors.accent}">${base.label}</text>
  ${lines
    .map(
      (line, index) =>
        `<text x="46" y="${blockTop + index * lineHeight}" font-family="Georgia, 'Times New Roman', serif" font-size="${size}" fill="${colors.ink}">${escapeXml(line)}</text>`,
    )
    .join("\n  ")}
  <text x="48" y="${Math.min(300, blockTop + lines.length * lineHeight + 30)}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="17" fill="${colors.ink}" opacity="0.72">${escapeXml(wrap(creator, 48, 1)[0] ?? "")}</text>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
  <defs>
    <linearGradient id="${id}-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${colors.bg}"/>
      <stop offset="1" stop-color="${colors.bgDeep}"/>
    </linearGradient>
    <linearGradient id="${id}-sheen" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#fff" stop-opacity="0.07"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
  </defs>${body}
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
