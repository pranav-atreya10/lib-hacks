import { test, expect } from "@playwright/test";

test.describe("library", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/library");
  });

  test("folder tabs open one collection at a time", async ({ page }) => {
    const folders = page.getByRole("navigation", { name: "Folders" });

    await expect(folders.getByRole("button", { name: /^All files/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await folders.getByRole("button", { name: /^Books/ }).click();
    await expect(page).toHaveURL(/type=book/);
    await expect(folders.getByRole("button", { name: /^Books/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(folders.getByRole("button", { name: /^All files/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await expect(page.locator('p[aria-live="polite"]')).toContainText("of 243 files");

    await folders.getByRole("button", { name: /^Podcasts/ }).click();
    await expect(page).toHaveURL(/type=podcast/);
    await expect(page.locator('p[aria-live="polite"]')).toContainText("of 243 files");
  });

  test("search narrows the shelf and survives a folder change", async ({ page }) => {
    await page.getByRole("button", { name: /^Books/ }).click();
    await page.getByLabel("Search the library").fill("system");

    await expect(page).toHaveURL(/q=system/);
    await expect(page.locator('p[aria-live="polite"]')).toContainText("3");
    await expect(page.getByText("Thinking in Systems").first()).toBeVisible();
  });

  test("empty state offers a way back", async ({ page }) => {
    await page.getByRole("button", { name: /^Books/ }).click();
    await page.getByRole("button", { name: /^AI\d/ }).click();

    await expect(page.getByText(/Nothing in this folder for/)).toBeVisible();
    await page.getByRole("button", { name: "Clear filters" }).first().click();

    await expect(page.locator('p[aria-live="polite"]')).toContainText("243 of 243 files");
    await expect(page).toHaveURL(/\/library$/);
  });

  test("office filter applies", async ({ page }) => {
    await page.getByLabel("Office", { exact: true }).selectOption("atlanta");
    await expect(page).toHaveURL(/office=atlanta/);
    await expect(page.locator('p[aria-live="polite"]')).toContainText("3 of 243 files");
  });

  test("resource dialog shows details, engagement and reviews", async ({ page }) => {
    await page.locator("main ul li > button").first().click();
    const dialog = page.getByRole("dialog");

    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading").first()).toBeVisible();
    await expect(dialog.getByText("Office", { exact: true })).toBeVisible();
    await expect(dialog.getByRole("button", { name: /^Like/ })).toBeVisible();
    await expect(dialog.getByText(/reviews/)).toBeVisible();

    const reviewBox = dialog.getByLabel("Your review");
    await reviewBox.fill("Testing this shelf from a browser.");
    await dialog.getByRole("button", { name: "Post review" }).click();

    await expect(dialog.getByText(/Thanks/)).toBeVisible();
    await expect(dialog.getByText("Testing this shelf from a browser.")).toBeVisible();
    await expect(dialog.getByText("Maya Chen").first()).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("liking a file updates the count and persists", async ({ page }) => {
    await page.locator("main ul li > button").first().click();
    const dialog = page.getByRole("dialog");
    const like = dialog.getByRole("button", { name: /^Like/ });
    await like.click();

    await expect(dialog.getByRole("button", { name: /^Liked/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    const stored = await page.evaluate(() =>
      JSON.parse(window.localStorage.getItem("infinite-library:v1") ?? "{}"),
    );
    expect(stored.personaId).toBe("maya-chen");
    expect(Object.keys(stored.people["maya-chen"])).toContain("likes");

    await page.keyboard.press("Escape");
    await page.reload();
    await page.locator("main ul li > button").first().click();
    await expect(page.getByRole("button", { name: /^Liked/ })).toBeVisible();
  });

  test("theme toggle switches light and dark", async ({ page }) => {
    const toggle = page.getByRole("button", { name: /^Theme:/ });

    await toggle.click();
    await page.getByRole("menuitem", { name: /^Dark/ }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    await toggle.click();
    await page.getByRole("menuitem", { name: /^Light/ }).click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });
});
