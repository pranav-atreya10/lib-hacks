import type { MediaType } from "./catalog";

export const TYPE_CODE: Record<MediaType, string> = {
  book: "BK",
  podcast: "PD",
  video: "VD",
  article: "AR",
};

export const TYPE_NOUN: Record<MediaType, string> = {
  book: "Book",
  podcast: "Podcast",
  video: "Video",
  article: "Article",
};

export function typeLabel(type: MediaType): string {
  return TYPE_NOUN[type];
}

/** e.g. "FP · BK · 03" — office shelf, medium, position on the shelf. */
export function catalogCode(
  officeCode: string,
  type: MediaType,
  ordinal: number,
): string {
  return `${officeCode} · ${TYPE_CODE[type]} · ${String(ordinal + 1).padStart(2, "0")}`;
}
