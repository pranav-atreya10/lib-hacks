import { test, expect } from "@playwright/test";

test.describe("public site", () => {
  test("landing shows the name, purpose and both calls to action", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Infinite Library/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Infinite Library/);
    await expect(page.getByText("Inspire. Engage. Innovate.").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Get started free/ })).toHaveAttribute("href", "/sign-up");
    await expect(page.getByRole("main").getByRole("link", { name: "Talk to sales" })).toBeVisible();
    await expect(page.getByText("Demo")).toHaveCount(0);
  });

  test("pricing sends paid plans to sales, and the form saves a lead", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("heading", { name: "Pricing" })).toBeVisible();
    const main = page.getByRole("main");
    await expect(main.getByRole("link", { name: "Talk to sales" })).toHaveCount(2);
    await main.getByRole("link", { name: "Talk to sales" }).last().click();
    await expect(page).toHaveURL(/contact-sales\?plan=enterprise/);
    await page.getByLabel("Your name").fill("Sam Lee");
    await page.getByLabel("Work email").fill("sam@example.org");
    await page.getByLabel("Company", { exact: true }).fill("Example Org");
    await page.getByRole("button", { name: "Talk to sales" }).click();
    await expect(page.getByText(/our team will reply/)).toBeVisible();
  });

  test("SSO buttons explain it's an Enterprise feature", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByRole("button", { name: "Continue with Okta / SAML" }).click();
    await expect(page.getByText(/sign-in is part of Enterprise/)).toBeVisible();
  });

  test("the app needs an account", async ({ page }) => {
    await page.goto("/app");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("repeated wrong passwords lock the account for a while", async ({ page }) => {
    const email = `locked-${Date.now()}@example.org`;
    await page.goto("/sign-in");
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      await page.getByLabel("Work email").fill(email);
      await page.getByLabel("Password").fill(`wrong-${attempt}`);
      await page.getByRole("button", { name: "Sign in" }).click();
      await expect(page.getByRole("main").getByRole("alert")).toContainText(attempt < 5 ? "don't match" : "Too many wrong passwords");
    }
    await page.getByLabel("Work email").fill(email);
    await page.getByLabel("Password").fill("anything-at-all");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toContainText(/Too many wrong passwords\. Try again in \d+ minutes?/);
  });

  test("a wrong password is refused", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel("Work email").fill("nobody@example.org");
    await page.getByLabel("Password").fill("not-the-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("That email and password don't match.")).toBeVisible();
  });
});
