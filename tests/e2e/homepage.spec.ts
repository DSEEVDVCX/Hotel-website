import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("loads with hero search and featured properties", async ({ page }) => {
    await page.goto("/");

    const searchForm = page.getByRole("form", { name: /ابحث عن غرفة|Search/ });
    await expect(searchForm).toBeVisible();
    await expect(searchForm.locator('input[placeholder], input[type="text"]')).toBeVisible();
    await expect(searchForm.locator('button[type="submit"]')).toBeVisible();
  });

  test("search form navigates to /search", async ({ page }) => {
    await page.goto("/");

    const searchForm = page.getByRole("form", { name: /ابحث عن غرفة|Search/ });
    await searchForm.locator('input[type="text"]').fill("Riyadh");
    await searchForm.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/search/);
  });

  test("displays featured property cards when hotels exist", async ({ page }) => {
    await page.goto("/");

    const cards = page.locator("a[href*='/hotels/']");
    const count = await cards.count();
    if (count > 0) {
      await expect(cards.first()).toBeVisible();
      await expect(cards.first()).toContainText(/SAR|ر\.س|ريال/);
    }
  });

  test("footer is present with navigation", async ({ page }) => {
    await page.goto("/");

    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    await expect(footer.locator("a")).toHaveCount(await footer.locator("a").count());
  });
});

test.describe("Homepage - Arabic RTL", () => {
  test.use({ locale: "ar-SA" });

  test("renders RTL by default", async ({ page }) => {
    await page.goto("/");

    const dir = await page.locator("html").getAttribute("dir");
    expect(dir).toBe("rtl");
  });
});

test.describe("Homepage - English LTR", () => {
  test("switches to English LTR", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("locale", "en");
    });
    await page.goto("/");

    await expect(page.locator("html")).toHaveAttribute("dir", "ltr", { timeout: 10000 });
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});
