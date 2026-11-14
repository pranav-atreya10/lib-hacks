import { test, expect } from "@playwright/test";
import { prepare } from "./helpers";

test.describe("library", () => {
  test("office folders come first, then only the company shelf", async ({ page }) => {
    await prepare(page);
    await page.goto("/library");

    const folders = page.getByRole("heading", { name: "Office folders" });
    const company = page.getByRole("heading", { name: "Company shelf" });
    await expect(folders).toBeVisible();
    const folderBox = await folders.boundingBox();
    const companyBox = await company.boundingBox();
    expect(folderBox!.y).toBeLessThan(companyBox!.y);

    // The offices our six people work in are listed before every other office.
    const peopleOffices = page.getByRole("list", { name: "Offices where our people work" });
    for (const city of ["New York", "Atlanta", "Austin", "Chicago", "Miami", "Seattle"]) {
      await expect(peopleOffices.getByText(city, { exact: true })).toBeVisible();
    }

    // Nothing from inside an office folder shows on the company shelf.
    await expect(page.locator('p[aria-live="polite"]')).toContainText("15 of 15 files");
    const cards = page.locator("main article");
    await expect(cards).toHaveCount(15);
    for (const footer of await cards.locator("> div:last-child > span:first-child").allInnerTexts()) {
      expect(footer).toBe("Company shelf");
    }
  });

  test("the visitor is view only", async ({ page }) => {
    await prepare(page);
    await page.goto("/library");

    await expect(page.getByRole("radio", { name: /Visitor/ })).toHaveAttribute("aria-checked", "true");
    await expect(page.getByText(/Hey there, did you know/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Recommend" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Like / })).toHaveCount(0);

    await page.locator("main article h3, main article button").filter({ hasText: "Sapiens" }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Visitors read reviews")).toBeVisible();
    await expect(dialog.getByLabel("Your review")).toHaveCount(0);
  });

  test("picking a person personalises the page and unlocks actions", async ({ page }) => {
    await prepare(page);
    await page.goto("/library");

    await page.getByRole("radio", { name: /Maya/ }).click();
    await expect(page.getByText(/Hey Maya, did you know/)).toBeVisible();
    await expect(page.getByText(/Top of Maya's ranking/)).toBeVisible();
    await expect(page.getByText("Maya’s office")).toBeVisible();
    await expect(page.getByRole("button", { name: "Recommend" })).toBeVisible();

    const like = page.getByRole("button", { name: /^Like Sapiens/ });
    const before = Number((await like.innerText()).replace(/\D/g, ""));
    await like.click();
    const unlike = page.getByRole("button", { name: /^Unlike Sapiens/ });
    await expect(unlike).toHaveAttribute("aria-pressed", "true");
    expect(Number((await unlike.innerText()).replace(/\D/g, ""))).toBe(before + 1);
  });

  test("type folders and search narrow the company shelf", async ({ page }) => {
    await prepare(page);
    await page.goto("/library");
    const folders = page.getByRole("navigation", { name: "Folders" });

    await folders.getByRole("button", { name: /^Books/ }).click();
    await expect(page).toHaveURL(/type=book/);
    await expect(page.locator('p[aria-live="polite"]')).toContainText("4 of 15 files");

    await page.getByLabel("Search the library").fill("systems");
    await expect(page).toHaveURL(/q=systems/);
    await expect(page.locator("main article")).toHaveCount(1);
    await expect(page.locator("main article")).toContainText("Thinking in Systems");

    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(page.locator('p[aria-live="polite"]')).toContainText("15 of 15 files");
  });

  test("a person can review a file", async ({ page }) => {
    await prepare(page, "jonah-reed");
    await page.goto("/library");

    await page.locator("main article button").filter({ hasText: "Mindset" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Mindset" })).toBeVisible();
    await dialog.getByRole("radio", { name: "4 stars" }).click();
    await dialog.getByLabel("Your review").fill("Testing this shelf from a browser.");
    await dialog.getByRole("button", { name: "Post review" }).click();
    await expect(dialog.getByText("Testing this shelf from a browser.")).toBeVisible();
    await expect(dialog.getByText("Jonah Reed", { exact: true })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("recommending puts a file in the person's own office folder", async ({ page }) => {
    await prepare(page, "jonah-reed");
    await page.goto("/library");

    await page.getByRole("button", { name: "Recommend" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Recommend to Atlanta" })).toBeVisible();
    await dialog.getByLabel("Link").fill("https://www.youtube.com/watch?v=arj7oStGLkU");
    await expect(dialog.getByRole("button", { name: "Video" })).toHaveAttribute("aria-pressed", "true");
    await expect(dialog.getByText("Cover preview")).toBeVisible();
    await dialog.getByLabel("Title").fill("Inside the Mind of a Master Procrastinator");
    await dialog.getByLabel("By").fill("Tim Urban · TED");
    await dialog.getByRole("button", { name: "Add to the shelf" }).click();

    await expect(page.getByRole("status")).toContainText("is on the Atlanta shelf");

    await page.goto("/offices/atlanta");
    await expect(page.locator('p[aria-live="polite"]')).toContainText("of 4 files");
    await expect(page.locator("main article").first()).toContainText("New from Jonah");
  });

  test("the guided tour is short, runs on the first visit and remembers it", async ({ page }) => {
    await page.goto("/library");
    const tour = page.getByRole("dialog");
    await expect(tour.getByRole("heading", { name: "Pick who’s reading" })).toBeVisible();
    await expect(tour).toContainText("1 of 4");

    await tour.getByRole("button", { name: "Next" }).click();
    // The tour reads as Maya from here so every feature is live.
    await expect(tour.getByRole("heading", { name: "Ranked for her, by everyone" })).toBeVisible();
    await expect(page.getByRole("radio", { name: /Maya/ })).toHaveAttribute("aria-checked", "true");

    await page.keyboard.press("ArrowRight");
    await expect(tour.getByRole("heading", { name: "Office folders" })).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await expect(tour.getByRole("heading", { name: /Like, review/ })).toBeVisible();
    await tour.getByRole("button", { name: "Done" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    await page.reload();
    await expect(page.getByRole("heading", { name: "The library" })).toBeVisible();
    await page.waitForTimeout(800);
    await expect(page.getByRole("dialog")).toBeHidden();

    await page.getByRole("button", { name: "Take the tour" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});

test.describe("tags", () => {
  test("people can tag files in their own office only", async ({ page }) => {
    await prepare(page, "jonah-reed");
    await page.goto("/offices/atlanta");
    await expect(page.getByText("Jonah, you work here.")).toBeVisible();

    await page.locator("main article button").first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(/You can tag this/)).toBeVisible();
    await dialog.getByRole("button", { name: "Add tag" }).click();
    await dialog.getByRole("button", { name: "Wellbeing", exact: true }).click();
    await expect(dialog.getByRole("list").getByText("Wellbeing")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Remove tag Wellbeing" })).toBeVisible();
    await page.keyboard.press("Escape");

    // The new tag is filterable straight away.
    await page.getByRole("button", { name: /^Wellbeing/ }).click();
    await expect(page.locator('p[aria-live="polite"]')).toContainText("1 of 3 files");

    // Another office is view only for tagging.
    await page.goto("/offices/chicago");
    await expect(page.getByText(/Only people in Chicago can recommend and tag here/)).toBeVisible();
    await page.locator("main article button").first().click();
    await expect(page.getByRole("dialog").getByRole("button", { name: "Add tag" })).toHaveCount(0);
  });
});
