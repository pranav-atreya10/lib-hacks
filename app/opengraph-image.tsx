import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = `${site.name} — ${site.purpose}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The card chat apps show when someone shares the link. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#111216",
          color: "#f5f3ee",
        }}
      >
        <svg width="96" height="96" viewBox="0 0 32 32">
          <rect width="32" height="32" rx="9" fill="#1f2026" />
          <path
            d="M16 16c-2.2-3.1-3.9-4.6-6-4.6a4.6 4.6 0 0 0 0 9.2c2.1 0 3.8-1.5 6-4.6"
            fill="none"
            stroke="#5b9cf2"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path
            d="M16 16c2.2-3.1 3.9-4.6 6-4.6a4.6 4.6 0 0 1 0 9.2c-2.1 0-3.8-1.5-6-4.6"
            fill="none"
            stroke="#eb9634"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </svg>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 112, letterSpacing: -4, lineHeight: 1 }}>{site.name}</div>
          <div style={{ fontSize: 48, color: "#eb9634", marginTop: 24 }}>{site.purpose}</div>
          <div style={{ fontSize: 30, color: "#a3a3ab", marginTop: 28 }}>
            Books, podcasts, talks and articles from 74 offices — ranked for whoever is reading.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
