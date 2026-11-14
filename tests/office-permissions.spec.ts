import { test, expect } from "@playwright/test";
import { prepare } from "./helpers";

for (const [id, first, home] of [
  ["jonah-reed", "Jonah", "Atlanta"],
  ["aarav-mehta", "Aarav", "Austin"],
] as const) {
  test(`${first} can't recommend to the New York office`, async ({ page }) => {
    await prepare(page, id);
    await page.goto("/offices/new-york-madison-ave");

    // The office page's button explains instead of opening the form.
    await page.getByRole("button", { name: "Recommend to New York" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const notice = page.getByText("You can’t recommend to New York");
    await expect(notice).toBeVisible();
    await expect(page.getByText(`${first}’s office is ${home}.`)).toBeVisible();

    // So does the sidebar's Recommend button while on this tab.
    await page.getByRole("complementary").getByRole("button", { name: "Recommend", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(notice).toBeVisible();

    // The notice offers a way to their own office, where recommending works.
    await page.getByRole("button", { name: `Go to ${home}` }).click();
    await expect(page).toHaveURL(new RegExp(`/offices/${home === "Atlanta" ? "atlanta" : "austin-400-w-6th"}$`));
    await page.getByRole("complementary").getByRole("button", { name: "Recommend", exact: true }).click();
    await expect(
      page.getByRole("dialog").getByRole("heading", { name: `Recommend to ${home}` }),
    ).toBeVisible();
  });
}

test("Maya can still recommend in New York", async ({ page }) => {
  await prepare(page, "maya-chen");
  await page.goto("/offices/new-york-madison-ave");
  await page.getByRole("complementary").getByRole("button", { name: "Recommend", exact: true }).click();
  await expect(
    page.getByRole("dialog").getByRole("heading", { name: "Recommend to New York" }),
  ).toBeVisible();
});
