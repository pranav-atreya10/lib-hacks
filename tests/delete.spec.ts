import { test, expect, type Page } from "@playwright/test";
import { prepare } from "./helpers";

async function recommendAsJonah(page: Page, title: string) {
  await page.goto("/offices/atlanta");
  await page.getByRole("button", { name: "Recommend to Atlanta" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Link").fill("https://www.youtube.com/watch?v=arj7oStGLkU");
  await dialog.getByLabel("Title").fill(title);
  await dialog.getByRole("button", { name: "Add to the shelf" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.locator('p[aria-live="polite"]:visible')).toContainText("of 4 files");
}

test.describe("deleting a recommendation", () => {
  test("the person who added a file can delete it, after confirming", async ({ page }) => {
    await prepare(page, "jonah-reed");
    await recommendAsJonah(page, "A talk to delete");

    await page.locator("main article:visible button").filter({ hasText: "A talk to delete" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("You added this")).toBeVisible();

    // The first press only asks; cancelling keeps the file.
    await dialog.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(dialog.getByText("Delete this recommendation?")).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog.getByText("You added this")).toBeVisible();

    await dialog.getByRole("button", { name: "Delete", exact: true }).click();
    await dialog.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.locator('p[aria-live="polite"]:visible')).toContainText("of 3 files");
    await expect(page.getByText("A talk to delete")).toHaveCount(0);

    // Gone after a reload too.
    await page.reload();
    await expect(page.locator('p[aria-live="polite"]:visible')).toContainText("of 3 files");
  });

  test("nobody else can delete it", async ({ page }) => {
    await prepare(page, "jonah-reed");
    await recommendAsJonah(page, "Jonah's pick");

    // Another person, even one who can open it, gets no delete control.
    await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem("infinite-library:v2")!);
      state.personaId = "maya-chen";
      localStorage.setItem("infinite-library:v2", JSON.stringify(state));
    });
    await page.reload();
    await page.locator("main article:visible button").filter({ hasText: "Jonah's pick" }).click();
    await expect(page.getByRole("dialog").getByRole("heading", { name: "Jonah's pick" })).toBeVisible();
    await expect(page.getByRole("dialog").getByText("You added this")).toHaveCount(0);
    await expect(page.getByRole("dialog").getByRole("button", { name: /Delete/ })).toHaveCount(0);
    await page.keyboard.press("Escape");

    // Nor can a visitor.
    await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem("infinite-library:v2")!);
      state.personaId = null;
      localStorage.setItem("infinite-library:v2", JSON.stringify(state));
    });
    await page.reload();
    await page.locator("main article:visible button").filter({ hasText: "Jonah's pick" }).click();
    await expect(page.getByRole("dialog").getByRole("button", { name: /Delete/ })).toHaveCount(0);
  });

  test("it can be deleted from the person's own recommendations list", async ({ page }) => {
    await prepare(page, "jonah-reed");
    await recommendAsJonah(page, "Listed pick");

    await page.goto("/people/jonah-reed");
    const list = page.getByRole("region", { name: "Your recommendations" });
    await expect(list).toContainText("Listed pick");
    await list.getByRole("button", { name: "Delete Listed pick" }).click();
    await list.getByRole("button", { name: "Confirm delete Listed pick" }).click();
    await expect(page.getByRole("heading", { name: "Your recommendations" })).toHaveCount(0);
    await expect(page.locator("main ol > li").first()).not.toContainText("Listed pick");
  });
});
