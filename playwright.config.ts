import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests for Infinite Library. The suite runs against the production
 * build on :3200 and reuses a server that is already running.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3200",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "npm run start -- --port 3200",
    url: "http://localhost:3200",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
