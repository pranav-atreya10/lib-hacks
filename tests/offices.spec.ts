import { test, expect } from "@playwright/test";

test.describe("offices", () => {
  test("index lists every office", async ({ page }) => {
    await page.goto("/offices");

    await expect(page.getByRole("heading", { name: "Office folders" })).toBeVisible();
    await expect(page.locator('main ul li a[href^="/offices/"]')).toHaveCount(74);
    await expect(page.getByText("Florham Park").first()).toBeVisible();
  });

  test("an office shelf is locked to that office", async ({ page }) => {
    await page.goto("/offices/atlanta");

    await expect(page.getByRole("heading", { name: "Atlanta", level: 1 })).toBeVisible();
    await expect(page.getByText(/files kept by this office/)).toBeVisible();
    await expect(page.getByLabel("Office", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Folders" })).toBeVisible();
    await expect(page.locator('p[aria-live="polite"]')).toContainText("of 3 files");
  });

  test("folder tabs work inside an office shelf", async ({ page }) => {
    await page.goto("/offices/atlanta");

    const folders = page.getByRole("navigation", { name: "Folders" });
    await folders.getByRole("button", { name: /^Books/ }).click();

    await expect(page).toHaveURL(/type=book/);
    await expect(folders.getByRole("button", { name: /^Books/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("unknown office shows the not-found page", async ({ page }) => {
    const response = await page.goto("/offices/nope-not-here");
    // Cache Components streams the shell with 200, then the 404 body; Next
    // marks that stream noindex so crawlers drop the URL.
    expect([200, 404]).toContain(response?.status());
    await expect(page.getByText(/isn’t in the catalogue/)).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
  });
});
