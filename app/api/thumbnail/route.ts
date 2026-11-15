import { cacheLife } from "next/cache";
import type { MediaType } from "@/lib/catalog";
import { findCover, linkPreview } from "@/lib/cover-lookup";

const TYPES: MediaType[] = ["book", "podcast", "video", "article"];

/**
 * GET /api/thumbnail?url=&type=&title=&creator=
 *
 * Redirects to the best cover image for a file, or answers 404 so the card
 * keeps its generated cover. With `format=json` it returns the image and the
 * page title instead, which the recommend form uses to fill itself in.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const url = (params.get("url") ?? "").slice(0, 2000);
  const rawType = params.get("type") ?? "article";
  const type = (TYPES as string[]).includes(rawType) ? (rawType as MediaType) : "article";
  const title = (params.get("title") ?? "").slice(0, 200);
  const creator = (params.get("creator") ?? "").slice(0, 200);

  if (params.get("format") === "json") {
    const result = await lookupJson(url, type, title, creator);
    return Response.json(result, {
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
    });
  }

  const image = await lookupCover(url, type, title, creator);
  if (!image) {
    return new Response(null, {
      status: 404,
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=21600" },
    });
  }
  return new Response(null, {
    status: 307,
    headers: {
      Location: image,
      "Cache-Control": "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800",
    },
  });
}

async function lookupCover(url: string, type: MediaType, title: string, creator: string) {
  "use cache";
  const image = await findCover(url, type, title, creator);
  // Found covers rarely change; misses are retried sooner.
  if (image) cacheLife("weeks");
  else cacheLife("hours");
  return image;
}

async function lookupJson(url: string, type: MediaType, title: string, creator: string) {
  "use cache";
  const [preview, image] = await Promise.all([
    linkPreview(url),
    findCover(url, type, title, creator),
  ]);
  if (image) cacheLife("days");
  else cacheLife("hours");
  return {
    image: image ?? preview.image,
    title: preview.title,
    creator: preview.creator ?? null,
    length: preview.length ?? null,
  };
}
