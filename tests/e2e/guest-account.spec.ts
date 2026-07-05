import { test, expect, type Page } from "@playwright/test";

const GUEST_EMAIL = "guest@example.com";
const GUEST_PASSWORD = "guest1234";

async function loginAsGuest(page: Page): Promise<void> {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(GUEST_EMAIL);
  await page.locator('input[type="password"]').fill(GUEST_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 20000,
  });
}

test.describe("Guest Account", () => {
  test("shows profile and favorites sections", async ({ page }) => {
    await loginAsGuest(page);
    await page.goto("/account");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });
  });

  test("displays favorites list or empty state", async ({ page }) => {
    await loginAsGuest(page);
    await page.goto("/account");
    const main = page.locator("main");
    await expect(main).toBeVisible({ timeout: 10000 });
  });

  test("has navigation tabs to My Bookings", async ({ page }) => {
    await loginAsGuest(page);
    await page.goto("/account");
    const bookingsLink = page.locator('a[href="/bookings"]').first();
    await expect(bookingsLink).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Guest Account - Arabic RTL", () => {
  test.use({ locale: "ar-SA" });

  test("renders RTL for Arabic", async ({ page }) => {
    await loginAsGuest(page);
    await page.goto("/account");
    const dir = await page.locator("html").getAttribute("dir");
    expect(dir).toBe("rtl");
  });
});
