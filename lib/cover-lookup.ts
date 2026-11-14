import "server-only";
import type { MediaType } from "./catalog";
import { youtubeId } from "./covers";

/**
 * Server-side cover finding. Every lookup is best effort: a slow or blocked
 * site returns null and the card keeps its generated cover.
 */

export interface LinkPreview {
  image: string | null;
  title: string | null;
}

const USER_AGENT =
  "Mozilla/5.0 (compatible; InfiniteLibraryBot/1.0; +https://infinity-library.vercel.app)";
const MAX_HTML_BYTES = 600_000;

/** Only fetch public web pages: no local hosts, no raw IP addresses. */
export function isFetchable(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  if (!host.includes(".")) return null;
  if (/^[\d.]+$/.test(host) || host.includes(":") || host.startsWith("[")) return null;
  if (/(^|\.)(localhost|local|internal|lan|home|corp|intranet)$/.test(host)) return null;
  if (url.port && url.port !== "80" && url.port !== "443") return null;
  return url;
}

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: { "user-agent": USER_AGENT, accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function getHtml(url: URL): Promise<{ html: string; finalUrl: string } | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": USER_AGENT,
        accept: "text/html,application/xhtml+xml",
        "accept-language": "en",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok || !response.body) return null;
    // A redirect can land somewhere we would not have fetched directly.
    if (!isFetchable(response.url || url.toString())) return null;
    const type = response.headers.get("content-type") ?? "";
    if (type && !type.includes("html")) return null;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let html = "";
    let bytes = 0;
    while (bytes < MAX_HTML_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      html += decoder.decode(value, { stream: true });
      // The tags we want live in <head>; stop once it closes.
      if (html.includes("</head>")) break;
    }
    reader.cancel().catch(() => {});
    return { html, finalUrl: response.url || url.toString() };
  } catch {
    return null;
  }
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x2F;/gi, "/")
    .trim();
}

function attr(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  if (!match) return null;
  return decodeEntities(match[2] ?? match[3] ?? match[4] ?? "");
}

/** og:image, twitter:image or <link rel="image_src">, made absolute. */
export function parsePreview(html: string, pageUrl: string): LinkPreview {
  const metas = html.match(/<meta\b[^>]*>/gi) ?? [];
  const lookup = new Map<string, string>();
  for (const tag of metas) {
    const key = (attr(tag, "property") ?? attr(tag, "name") ?? attr(tag, "itemprop"))?.toLowerCase();
    const content = attr(tag, "content");
    if (key && content && !lookup.has(key)) lookup.set(key, content);
  }

  const linkImage = (html.match(/<link\b[^>]*rel=["']?image_src["']?[^>]*>/i) ?? [])[0];
  const rawImage =
    lookup.get("og:image:secure_url") ??
    lookup.get("og:image") ??
    lookup.get("og:image:url") ??
    lookup.get("twitter:image") ??
    lookup.get("twitter:image:src") ??
    lookup.get("image") ??
    (linkImage ? attr(linkImage, "href") : null);

  let image: string | null = null;
  if (rawImage) {
    try {
      const absolute = new URL(rawImage, pageUrl);
      if (absolute.protocol === "http:") absolute.protocol = "https:";
      image = absolute.toString();
    } catch {
      image = null;
    }
  }

  const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1];
  const title =
    lookup.get("og:title") ?? lookup.get("twitter:title") ?? (titleTag ? decodeEntities(titleTag) : null);

  return { image, title: title || null };
}

export async function linkPreview(raw: string): Promise<LinkPreview> {
  const url = isFetchable(raw);
  if (!url) return { image: null, title: null };
  const page = await getHtml(url);
  if (!page) return { image: null, title: null };
  return parsePreview(page.html, page.finalUrl);
}

async function openLibraryCover(title: string, creator: string): Promise<string | null> {
  type Search = { docs?: { cover_i?: number }[] };
  const author = creator.replace(/\(.*?\)/g, "").split(/,|&| and /)[0]?.trim() ?? "";
  const attempts: Record<string, string>[] = author ? [{ title, author }, { title }] : [{ title }];
  for (const query of attempts) {
    const params = new URLSearchParams({ ...query, limit: "5", fields: "cover_i" });
    const data = await getJson<Search>(`https://openlibrary.org/search.json?${params}`);
    const cover = data?.docs?.find((doc) => typeof doc.cover_i === "number")?.cover_i;
    if (cover) return `https://covers.openlibrary.org/b/id/${cover}-L.jpg`;
  }
  return null;
}

async function googleBooksCover(title: string, creator: string): Promise<string | null> {
  type Volumes = {
    items?: { volumeInfo?: { imageLinks?: { thumbnail?: string; smallThumbnail?: string } } }[];
  };
  const author = creator.replace(/\(.*?\)/g, "").split(/,|&| and /)[0]?.trim();
  const q = `intitle:${title}${author ? ` inauthor:${author}` : ""}`;
  const data = await getJson<Volumes>(
    `https://www.googleapis.com/books/v1/volumes?${new URLSearchParams({ q, maxResults: "3", printType: "books" })}`,
  );
  const links = data?.items?.find((item) => item.volumeInfo?.imageLinks)?.volumeInfo?.imageLinks;
  const raw = links?.thumbnail ?? links?.smallThumbnail;
  if (!raw) return null;
  return raw.replace(/^http:/, "https:").replace(/&edge=curl/, "").replace(/zoom=1/, "zoom=2");
}

async function podcastArtwork(title: string): Promise<string | null> {
  type Results = { results?: { artworkUrl600?: string; artworkUrl100?: string }[] };
  const data = await getJson<Results>(
    `https://itunes.apple.com/search?${new URLSearchParams({ term: title, entity: "podcast", limit: "1" })}`,
  );
  const hit = data?.results?.[0];
  return hit?.artworkUrl600 ?? hit?.artworkUrl100?.replace("100x100", "600x600") ?? null;
}

/** Search-result pages (like a Goodreads search) carry the site's logo, not the work. */
function isSearchPage(raw: string): boolean {
  try {
    const url = new URL(raw);
    return /\/search\b/.test(url.pathname) || url.searchParams.has("search_query");
  } catch {
    return false;
  }
}

/**
 * The best image we can find for a file. Books try book-cover databases first,
 * podcasts try podcast artwork, and everything falls back to the link's own
 * preview image.
 */
export async function findCover(
  url: string,
  type: MediaType,
  title: string,
  creator: string,
): Promise<string | null> {
  const video = youtubeId(url);
  if (video) return `https://i.ytimg.com/vi/${video}/hqdefault.jpg`;

  if (type === "book" && title) {
    const cover = (await openLibraryCover(title, creator)) ?? (await googleBooksCover(title, creator));
    if (cover) return cover;
  }

  if (type === "podcast" && title) {
    const art = await podcastArtwork(title);
    if (art) return art;
  }

  if (!isSearchPage(url)) {
    const preview = await linkPreview(url);
    if (preview.image) return preview.image;
  }

  return null;
}
