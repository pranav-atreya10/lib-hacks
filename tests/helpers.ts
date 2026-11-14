import type { Page } from "@playwright/test";

/**
 * Start a test with the guided tour already seen (so it doesn't cover the
 * page) and, optionally, reading as one of the six people.
 */
export async function prepare(page: Page, personaId: string | null = null) {
  await page.addInitScript((id) => {
    if (window.sessionStorage.getItem("prepared")) return;
    window.sessionStorage.setItem("prepared", "1");
    window.localStorage.setItem("infinite-library:tour-done", "1");
    window.localStorage.setItem(
      "infinite-library:v2",
      JSON.stringify({ personaId: id, people: {}, tagAdds: {} }),
    );
  }, personaId);
}
