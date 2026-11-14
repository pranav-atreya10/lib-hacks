import type { MediaType } from "./catalog";

/** What a cover lookup needs to know about a file. */
export interface CoverInput {
  url: string;
  type: MediaType;
  title: string;
  creator: string;
}

/** The video id from any common YouTube link shape, or null. */
export function youtubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") return clean(parsed.pathname.slice(1));
    if (host !== "youtube.com" && host !== "youtube-nocookie.com") return null;
    if (parsed.pathname === "/watch") return clean(parsed.searchParams.get("v"));
    const match = parsed.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
    return match ? clean(match[1]) : null;
  } catch {
    return null;
  }
}

function clean(value: string | null | undefined): string | null {
  return value && /^[\w-]{6,20}$/.test(value) ? value : null;
}

/**
 * Where the browser should load a cover from. YouTube videos go straight to
 * YouTube's still; everything else asks our own route, which finds the
 * page's preview image, a book cover or podcast artwork.
 */
export function coverSrc(input: CoverInput): string {
  const id = youtubeId(input.url);
  if (id) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  const params = new URLSearchParams({
    url: input.url,
    type: input.type,
    title: input.title,
    creator: input.creator,
  });
  return `/api/thumbnail?${params.toString()}`;
}

/** A best guess at the kind of file from its link, for the recommend form. */
export function guessType(url: string): MediaType | null {
  let host = "";
  let path = "";
  try {
    const parsed = new URL(url);
    host = parsed.hostname.replace(/^www\./, "");
    path = parsed.pathname;
  } catch {
    return null;
  }
  if (youtubeId(url) || /(^|\.)youtube\.com$|vimeo\.com$|ted\.com$/.test(host)) {
    return host.endsWith("ted.com") && path.startsWith("/podcasts") ? "podcast" : "video";
  }
  if (
    /podcasts\.apple\.com$|pca\.st$|overcast\.fm$|\.fm$/.test(host) ||
    (host.endsWith("spotify.com") && /\/(show|episode)\//.test(path))
  ) {
    return "podcast";
  }
  if (
    /goodreads\.com$|openlibrary\.org$|bookshop\.org$|books\.google\./.test(host) ||
    (host.includes("amazon.") && /\/(dp|gp\/product)\//.test(path))
  ) {
    return "book";
  }
  return "article";
}
