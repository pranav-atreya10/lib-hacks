import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Database drivers run as plain Node packages, not bundled.
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
