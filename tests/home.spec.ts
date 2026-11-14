import { test, expect } from "@playwright/test";

test.describe("home", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("shows the name, purpose and demo labels", async ({ page }) => {
    await expect(page).toHaveTitle(/Infinite Library/);
    await expect(page.getByText(/imagine\. inspire\. engage\./i).first()).toBeVisible();
    await expect(page.locator("header")).toContainText("Infinite Library");
    await expect(page.locator("header")).toContainText("Demo");
    await expect(page.locator("footer")).toContainText("sample content");
  });

  test("puts the folders at the top level", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Folders", exact: true })).toBeVisible();
    await expect(page.locator('a[href^="/library?type="]')).toHaveCount(4);
    await expect(page.locator('a[href="/offices"]').first()).toBeVisible();
  });

  test("lists six readers and the cross-pollination band", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Who is reading" })).toBeVisible();
    const people = page
      .getByRole("heading", { name: "Who is reading" })
      .locator("xpath=ancestor::section[1]");
    await expect(people.locator('a[href^="/people/"]')).toHaveCount(6);
    await expect(
      page.getByRole("heading", {
        name: "Push out of your comfort zone, unlike social media.",
      }),
    ).toBeVisible();
    await expect(page.getByText(/Aarav is 19/)).toBeVisible();
  });

  test("shows trending files and office folders", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Trending this week" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Office folders" })).toBeVisible();
    const trending = page
      .getByRole("heading", { name: "Trending this week" })
      .locator("xpath=ancestor::section[1]");
    await expect(trending.getByRole("link", { name: /folder$/i })).toHaveCount(3);
  });
});
