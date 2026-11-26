import { test, expect, type Page } from "@playwright/test";

const run = Date.now().toString(36);
const domain = `acme${run}.com`;
const admin = { name: "Priya Shah", email: `priya@${domain}`, password: "correct-horse-1" };
const member = { name: "Marcus Diaz", email: `marcus@${domain}`, password: "battery-staple-2" };

async function signUp(page: Page, person: typeof admin) {
  // Skip the one-time intro slides and welcome tour so they don't cover the UI.
  await page.addInitScript(() => {
    try {
      localStorage.setItem("infinite-library:intro-seen", "1");
      localStorage.setItem("infinite-library:welcome-done", "1");
    } catch {}
  });
  await page.goto("/sign-up");
  await page.getByLabel("Full name").fill(person.name);
  await page.getByLabel("Work email").fill(person.email);
  await page.getByLabel("Password").fill(person.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/onboarding/);
}

async function onboard(page: Page, interests: string[], creator: boolean) {
  for (const interest of interests) {
    await page.getByRole("group", { name: "Interests" }).getByRole("button", { name: interest, exact: true }).click();
  }
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: /Like a few things/ })).toBeVisible();
  await page.getByRole("button", { name: /^Like / }).first().click();
  if (creator) {
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("heading", { name: "Stock the company library" })).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("heading", { name: "Invite your team" })).toBeVisible();
  }
  await page.getByRole("button", { name: "Open my library" }).click();
  await expect(page).toHaveURL(/\/app(\?|$)/);
}

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  // Every test starts past the one-time intro slides and welcome tour.
  await page.addInitScript(() => {
    try {
      localStorage.setItem("infinite-library:intro-seen", "1");
      localStorage.setItem("infinite-library:welcome-done", "1");
    } catch {}
  });
});

test.describe("a company workspace", () => {
  let libraryUrl = "";

  test("an admin creates the company and a library, and recommends to it", async ({ page }) => {
    await signUp(page, admin);
    await page.getByLabel("Company name").fill(`Acme ${run}`);
    await page.getByRole("button", { name: "Create workspace" }).click();
    await expect(page.getByRole("heading", { name: "Make the library yours" })).toBeVisible();
    await onboard(page, ["Leadership", "Strategy", "Finance"], true);

    await expect(page.getByRole("heading", { level: 1 })).toContainText("Hey Priya, did you know");
    await expect(page.getByRole("heading", { name: "For you" })).toBeVisible();

    await page.goto("/app/libraries");
    await page.getByRole("button", { name: "New library" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Name").fill("India delivery team");
    await dialog.getByLabel("Start from").selectOption("team");
    await dialog.getByRole("button", { name: "Create library" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "India delivery team" })).toBeVisible();
    libraryUrl = page.url();

    await page.getByRole("button", { name: "Recommend" }).click();
    const form = page.getByRole("dialog");
    await form.getByLabel("Link").fill("https://example.org/essays/managing-remote-teams");
    await form.getByLabel("Title").fill("Managing remote teams well");
    await form.getByLabel("By").fill("Example Press");
    await form.getByRole("button", { name: "Add to the shelf" }).click();
    await expect(page.getByText("Added “Managing remote teams well” to India delivery team")).toBeVisible();
    await expect(page.getByRole("link", { name: "Managing remote teams well" })).toBeVisible();
  });

  test("a colleague with the company's domain asks to join, and the admin approves", async ({ page, browser }) => {
    await signUp(page, member);
    // Same work domain: a request, not an automatic way in.
    await expect(page.getByRole("heading", { name: `Waiting for Acme ${run}` })).toBeVisible();
    await page.goto("/app");
    await expect(page).toHaveURL(/\/onboarding/);

    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await adminPage.addInitScript(() => {
      try {
        localStorage.setItem("infinite-library:welcome-done", "1");
      } catch {}
    });
    await adminPage.goto("/sign-in");
    await adminPage.getByLabel("Work email").fill(admin.email);
    await adminPage.getByLabel("Password").fill(admin.password);
    await adminPage.getByRole("button", { name: "Sign in" }).click();
    await expect(adminPage.getByText("1 person wants to join")).toBeVisible();
    await adminPage.goto("/app/admin");
    await adminPage.getByRole("button", { name: "Approve Marcus Diaz" }).click();
    await expect(adminPage.getByText("Marcus Diaz joined")).toBeVisible();
    await adminContext.close();

    await page.getByRole("button", { name: "Check again" }).click();
    await expect(page.getByRole("heading", { name: "Make the library yours" })).toBeVisible();
  });

  test("the colleague joins the library and reads", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel("Work email").fill(member.email);
    await page.getByLabel("Password").fill(member.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/onboarding/);
    await onboard(page, ["Engineering", "AI", "Data"], false);

    await page.goto(libraryUrl);
    await page.getByRole("button", { name: "Join library" }).click();
    await expect(page.getByRole("button", { name: "Recommend" })).toBeVisible();

    await page.getByRole("link", { name: "Managing remote teams well" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Managing remote teams well" })).toBeVisible();
    await page.getByRole("button", { name: /^Like Managing remote teams well/ }).click();
    await expect(page.getByRole("button", { name: /^Unlike Managing remote teams well/ })).toBeVisible();
    await page.getByLabel("Your review").fill("Practical and short. The async stand-up idea works.");
    await page.getByRole("button", { name: "Post review" }).click();
    await expect(page.getByText("Practical and short. The async stand-up idea works.")).toBeVisible();

    // Not theirs, not their library: no delete.
    await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);
  });

  test("the library admin sees insights, coaches, and picks a giveaway winner", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel("Work email").fill(admin.email);
    await page.getByLabel("Password").fill(admin.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/app(\?|$)/);

    await page.goto(`${libraryUrl}/insights`);
    await expect(page.getByRole("heading", { name: "Team insights" })).toBeVisible();
    const row = page.getByRole("row", { name: /Marcus Diaz/ });
    await expect(row).toContainText("1");

    await row.getByRole("link", { name: /Marcus Diaz/ }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Marcus Diaz" })).toBeVisible();
    await expect(page.getByText("Coaching prompts")).toBeVisible();
    await page.getByRole("textbox", { name: "Coaching note" }).fill("Great review this week — want to lead the next session?");
    await page.getByRole("button", { name: "Save note" }).click();
    await expect(page.getByText("Great review this week — want to lead the next session?")).toBeVisible();
    await page.getByRole("button", { name: "Assign read" }).click();
    await expect(page.locator("[data-sonner-toast]").getByText("Assigned")).toBeVisible();

    await page.goto(`${libraryUrl}/insights#giveaway`);
    await page.getByLabel("Prize").fill("A $50 book voucher");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("Prize saved")).toBeVisible();
    const winner = page.getByLabel("Winner");
    const value = await winner.locator("option", { hasText: "Marcus Diaz" }).getAttribute("value");
    await winner.selectOption(value!);
    await page.getByRole("button", { name: "Pick winner" }).click();
    await expect(page.getByText("Winner picked")).toBeVisible();

    await page.goto("/app/trends");
    await expect(page.getByRole("heading", { name: "Trends" })).toBeVisible();
    await expect(page.getByText("Top contributors this month")).toBeVisible();

    const download = page.waitForEvent("download");
    await page.goto("/app/admin");
    await page.getByRole("link", { name: "Export activity (CSV)" }).click();
    expect((await download).suggestedFilename()).toMatch(/activity\.csv$/);
  });

  test("the colleague sees what their lead sees, plus the note, read and prize", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel("Work email").fill(member.email);
    await page.getByLabel("Password").fill(member.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/app(\?|$)/);
    await expect(page.getByText("Assigned to you")).toBeVisible();
    await expect(page.getByText("Great review this week — want to lead the next session?")).toBeVisible();
    await expect(page.getByText(/You won A \$50 book voucher/)).toBeVisible();

    await page.goto("/app/me");
    await expect(page.getByText("This is exactly what admins of your libraries see about you")).toBeVisible();
    await expect(page.getByText("What your leads see")).toBeVisible();

    // Members can't open a library's insights.
    await page.goto(`${libraryUrl}/insights`);
    await expect(page).toHaveURL(libraryUrl);
  });

  test("the person who added a file can delete it", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel("Work email").fill(admin.email);
    await page.getByLabel("Password").fill(admin.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/app(\?|$)/);
    await page.goto(libraryUrl);
    await page.getByRole("link", { name: "Managing remote teams well" }).click();
    await page.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Delete" }).last().click();
    await expect(page).toHaveURL(libraryUrl);
    await expect(page.getByRole("link", { name: "Managing remote teams well" })).toHaveCount(0);
  });
});
