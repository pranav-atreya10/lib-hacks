import { test, expect } from "@playwright/test";
import { prepare } from "./helpers";

test.describe("people", () => {
  test("index lists six readers with their top picks", async ({ page }) => {
    await page.goto("/people");

    await expect(page.getByRole("heading", { name: "Six people, six shelves" })).toBeVisible();
    const cards = page.locator("main article");
    await expect(cards).toHaveCount(6);
    await expect(cards.first()).toContainText("Maya Chen");
    await expect(cards.first()).toContainText("Top of their shelf");
    await expect(cards.first().getByRole("link")).toHaveAttribute("href", "/people/maya-chen");
  });

  test("shelf shows a personalised ranking and dashboard", async ({ page }) => {
    await prepare(page, "maya-chen");
    await page.goto("/people/maya-chen");

    await expect(page.getByRole("heading", { name: "Maya Chen", level: 1 })).toBeVisible();
    await expect(page.getByText(/Hey Maya, did you know/)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Maya’s shelf, ranked/ })).toBeVisible();

    const rows = page.locator("main ol > li");
    await expect(rows).toHaveCount(10);
    await expect(rows.first()).toContainText(/Matches/);
    await expect(page.getByRole("heading", { name: "Outside your bubble" })).toBeVisible();
  });

  test("ranking differs between two people", async ({ page }) => {
    await page.goto("/people/maya-chen");
    const mayaTop = await page.locator("main ol > li").first().innerText();

    await page.goto("/people/jonah-reed");
    const jonahTop = await page.locator("main ol > li").first().innerText();

    expect(mayaTop.split("\n")[1]).not.toBe(jonahTop.split("\n")[1]);
  });

  test("liking a file updates the dashboard metric", async ({ page }) => {
    await prepare(page, "maya-chen");
    await page.goto("/people/maya-chen");

    const metrics = page.locator("main dl dd");
    await expect(metrics.nth(1)).toHaveText("0");

    await page.getByRole("button", { name: /^Like / }).first().click();

    await expect(metrics.nth(1)).toHaveText("1");
    await expect(page.getByRole("button", { name: /^Unlike / }).first()).toBeVisible();
  });

  test("recommending a file puts it at the top and persists", async ({ page }) => {
    await prepare(page, "maya-chen");
    await page.goto("/people/maya-chen");
    await page.getByRole("button", { name: "Recommend" }).click();

    const form = page.getByRole("dialog");
    await form.getByLabel("Link").fill("https://www.navalmanack.com/");
    await form.getByLabel("Title").fill("The Almanack of Naval Ravikant");
    await form.getByLabel("By").fill("Eric Jorgenson");
    await form.getByLabel("Length").fill("5h read");
    await form.getByLabel("Why should someone open it?").fill("Short chapters on judgment and leverage.");
    await form.getByRole("button", { name: "Book" }).click();
    await form.getByRole("button", { name: "Finance" }).click();
    await form.getByRole("button", { name: "Add to the shelf" }).click();

    await expect(page.getByText(/is on the New York shelf and at the top of your ranking/)).toBeVisible();
    const first = page.locator("main ol > li").first();
    await expect(first).toContainText("The Almanack of Naval Ravikant");
    await expect(first).toContainText("Added by you");
    await expect(page.locator("main dl dd").nth(3)).toHaveText("1");

    await page.reload();
    await expect(page.locator("main ol > li").first()).toContainText("The Almanack of Naval Ravikant");
    await expect(page.getByRole("heading", { name: "Your recommendations" })).toBeVisible();
  });

  test("opening someone else's shelf keeps your identity", async ({ page }) => {
    await prepare(page, "maya-chen");
    await page.goto("/people/jonah-reed");

    await expect(page.getByText(/You’re reading Jonah Reed’s shelf as Maya Chen/)).toBeVisible();
    await expect(page.getByRole("button", { name: /^Viewing as Maya Chen/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Recommend" })).toHaveCount(0);

    const stored = await page.evaluate(() =>
      JSON.parse(window.localStorage.getItem("infinite-library:v2") ?? "{}"),
    );
    expect(stored.personaId).toBe("maya-chen");

    await page.getByRole("button", { name: "Read as Jonah" }).click();
    await expect(page.getByRole("button", { name: /^Viewing as Jonah Reed/ })).toBeVisible();
    await expect(page.getByText(/You’re reading/)).toHaveCount(0);
  });

  test("a visitor can read any shelf but not act on it", async ({ page }) => {
    await prepare(page);
    await page.goto("/people/maya-chen");

    await expect(page.getByText(/You’re a visitor reading Maya Chen’s shelf/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Recommend" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Like / })).toHaveCount(0);
  });

  test("the header picker changes identity", async ({ page }) => {
    await prepare(page, "maya-chen");
    await page.goto("/people/jonah-reed");

    await page.getByRole("button", { name: /^Viewing as Maya Chen/ }).click();
    await page.getByRole("menuitem", { name: /Jonah Reed/ }).click();

    await expect(page.getByRole("button", { name: /^Viewing as Jonah Reed/ })).toBeVisible();
    await expect(page.getByText(/You’re reading/)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Recommend" })).toBeVisible();
    await expect(page.getByText(/Hey Jonah/)).toBeVisible();

    await page.getByRole("button", { name: /^Viewing as Jonah Reed/ }).click();
    await page.getByRole("menuitem", { name: /Visitor/ }).click();
    await expect(page.getByRole("button", { name: /^Viewing as Visitor/ })).toBeVisible();

    const stored = await page.evaluate(() =>
      JSON.parse(window.localStorage.getItem("infinite-library:v2") ?? "{}"),
    );
    expect(stored.personaId).toBe(null);
  });

  test("unknown person shows the not-found page", async ({ page }) => {
    const response = await page.goto("/people/not-a-person");
    // Cache Components streams the shell with 200, then the 404 body; Next
    // marks that stream noindex so crawlers drop the URL.
    expect([200, 404]).toContain(response?.status());
    await expect(page.getByText(/isn’t in the catalogue/)).toBeVisible();
    await expect(page.getByRole("heading", { name: /catalogue/ })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
  });
});
