import { test, expect, type Page } from "@playwright/test";

const ADMIN_EMAIL = "admin";
const ADMIN_PASSWORD = "admin";

async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto("/admin/login");
  const emailInput = page.locator('input[autocomplete="username"]');
  const passwordInput = page.locator('input[type="password"]');
  await expect(emailInput).toBeVisible({ timeout: 10000 });
  await emailInput.fill(ADMIN_EMAIL);
  await passwordInput.fill(ADMIN_PASSWORD);
  await emailInput.fill(ADMIN_EMAIL);
  await expect(emailInput).toHaveValue(ADMIN_EMAIL);
  await expect(passwordInput).toHaveValue(ADMIN_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.startsWith("/admin/login"), {
    timeout: 20000,
  });
}

test.describe("Admin Management Panel", () => {
  test("admin logs in and sees the dashboard with KPIs (Arabic RTL)", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/dashboard");

    // Arabic-first / RTL by default.
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");

    // Property switcher is rendered in the layout.
    const switcher = page.locator("#property-switcher");
    await expect(switcher).toBeVisible();

    // Overview heading (Arabic).
    await expect(page.getByRole("heading", { name: "نظرة عامة" })).toBeVisible();

    // Period selector exposes two date inputs.
    await expect(page.locator('input[type="date"]')).toHaveCount(2);

    const firstValue = await switcher.locator("option").nth(1).getAttribute("value");
    if (firstValue) await switcher.selectOption({ value: firstValue });
    await expect(page).toHaveURL(/hotelId=/, { timeout: 20000 });

    // Wait for the occupancy KPI card label to render.
    await expect(page.getByText("معدل الإشغال")).toBeVisible({ timeout: 20000 });
  });

  test("admin can upload and delete media through the media API", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    await page.waitForURL((url) => !url.pathname.startsWith("/admin/login"), { timeout: 20000 });

    // Resolve the first owned hotel for the media owner.
    const hotelsRes = await page.request.get("/api/admin/manage/hotels");
    expect(hotelsRes.ok()).toBeTruthy();
    const { hotels } = await hotelsRes.json();
    test.skip(!hotels || hotels.length === 0, "admin owns no hotel yet");

    const hotelId = hotels[0].id;

    // Upload (POST) — shares the browser session cookies via page.request.
    const createRes = await page.request.post("/api/admin/manage/media", {
      data: {
        ownerType: "HOTEL",
        ownerId: hotelId,
        url: "https://example.com/e2e-media.png",
        captionAr: "اختبار وسائط",
        captionEn: "e2e media",
        sortOrder: 999,
      },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    expect(created.url).toBe("https://example.com/e2e-media.png");

    // List (GET) reflects the new asset.
    const listRes = await page.request.get(
      `/api/admin/manage/media?ownerType=HOTEL&ownerId=${hotelId}`
    );
    expect(listRes.ok()).toBeTruthy();
    const { assets } = await listRes.json();
    expect(assets.some((a: { id: string }) => a.id === created.id)).toBeTruthy();

    // Cleanup (DELETE).
    const deleteRes = await page.request.delete(`/api/admin/manage/media/${created.id}`);
    expect(deleteRes.ok()).toBeTruthy();
  });

  test("admin dashboard renders in English LTR", async ({ page }) => {
    // Force English before first paint to verify the LTR direction.
    await page.addInitScript(() => {
      localStorage.setItem("locale", "en");
    });
    await loginAsAdmin(page);
    await page.goto("/admin/dashboard");

    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
    await expect(page.locator("#property-switcher")).toBeVisible();

    const switcher = page.locator("#property-switcher");
    const firstValue = await switcher.locator("option").nth(1).getAttribute("value");
    if (firstValue) await switcher.selectOption({ value: firstValue });
    await expect(page).toHaveURL(/hotelId=/, { timeout: 20000 });

    // Occupancy KPI label in English.
    await expect(page.getByText("Occupancy Rate")).toBeVisible({ timeout: 20000 });
  });

  test("property switcher updates the hotelId in the URL", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/dashboard");

    const switcher = page.locator("#property-switcher");
    await expect(switcher).toBeVisible();

    const options = await switcher.locator("option").count();
    test.skip(options < 2, "admin owns fewer than one hotel");

    // Selecting the first real hotel (index 1, after the placeholder) writes
    // ?hotelId=... into the URL.
    const firstValue = await switcher.locator("option").nth(1).getAttribute("value");
    await switcher.selectOption({ value: firstValue! });

    await expect(page).toHaveURL(/hotelId=/, { timeout: 10000 });
  });
});
