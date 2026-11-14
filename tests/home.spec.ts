import { test, expect } from "@playwright/test";

test.describe("home", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("shows the name, purpose and demo labels", async ({ page }) => {
    await expect(page).toHaveTitle(/Infinite Library/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Infinite Library/);
    await expect(page.getByText("Inspire. Engage. Innovate.").first()).toBeVisible();
    await expect(page.locator("header")).toContainText("Infinite Library");
    await expect(page.locator("header")).toContainText("Demo");
    await expect(page.locator("footer")).toContainText("sample content");
  });

  test("sends judges into the app through one clear call to action", async ({
    page,
  }) => {
    const cta = page.getByRole("link", {
      name: /judges, click here for the app/i,
    });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/library");
    await page.evaluate(() => localStorage.setItem("infinite-library:tour-done", "1"));
    await cta.click();
    await expect(page).toHaveURL(/\/library$/);
    await expect(
      page.getByRole("heading", { name: "The library", level: 1 }),
    ).toBeVisible();
  });

  test("stays a poster: no shelves, folders or identity picker", async ({
    page,
  }) => {
    await expect(page.locator('a[href^="/library?type="]')).toHaveCount(0);
    await expect(page.locator('a[href^="/people/"]')).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Who is reading" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Folders" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Viewing as/ })).toHaveCount(0);
  });
});
