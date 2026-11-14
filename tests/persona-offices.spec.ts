import { test, expect } from "@playwright/test";
import { prepare } from "./helpers";
import { PERSONAS } from "../lib/personas";
import { officeBySlug } from "../lib/offices";

/**
 * Every person's own office folder has to work end to end: reachable from the
 * library, full of files, and open to them for recommending and tagging.
 */
for (const persona of PERSONAS) {
  const office = officeBySlug.get(persona.office)!;
  const first = persona.name.split(" ")[0];

  test(`${first}'s office folder (${office.name}) works`, async ({ page }) => {
    await prepare(page, persona.id);
    await page.goto("/library");

    // The big "your office" folder leads to the right shelf.
    await page.getByRole("link", { name: new RegExp(`${first}’s office`) }).click();
    await expect(page).toHaveURL(new RegExp(`/offices/${office.slug}$`));
    await expect(page.getByRole("heading", { level: 1, name: office.name })).toBeVisible();
    await expect(page.getByText(`${first}, you work here.`)).toBeVisible();

    const cards = page.locator("main article:visible");
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(3);
    await expect(page.locator('p[aria-live="polite"]:visible')).toContainText(`of ${count} files`);

    // They can tag files here…
    await cards.first().locator("button").first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(/You can tag this/)).toBeVisible();
    await page.keyboard.press("Escape");

    // …and recommend to this office.
    await page.getByRole("button", { name: "Recommend" }).click();
    await expect(
      page.getByRole("dialog").getByRole("heading", { name: `Recommend to ${office.city}` }),
    ).toBeVisible();
  });

  test(`a visitor can open ${office.name} from the library`, async ({ page }) => {
    await prepare(page);
    await page.goto("/library");
    const folders = page.getByRole("list", { name: "Offices where our people work" });
    await folders.locator(`a[href="/offices/${office.slug}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/offices/${office.slug}$`));
    await expect(page.locator("main article:visible").first()).toBeVisible();
    await expect(page.getByRole("button", { name: `Read as ${first}` })).toBeVisible();
  });
}
