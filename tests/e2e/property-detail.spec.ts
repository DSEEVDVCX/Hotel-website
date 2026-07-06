import { test, expect, type Page } from "@playwright/test";

function isoDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

const CHECK_IN = isoDate(7);
const CHECK_OUT = isoDate(9);

async function discoverRoomTypeId(page: Page): Promise<string | null> {
  await page.goto("/rooms");
  const link = page.locator("a[href*='/rooms/']").first();
  if ((await link.count()) === 0) return null;
  const href = await link.getAttribute("href");
  if (!href) return null;
  const match = href.match(/\/rooms\/([^/?#]+)/);
  return match ? match[1] : null;
}

async function openRoomDetail(page: Page, roomTypeId: string) {
  await page.goto(`/rooms/${roomTypeId}?checkIn=${CHECK_IN}&checkOut=${CHECK_OUT}&guests=2`);
  await expect(page.getByTestId("property-gallery")).toBeVisible({ timeout: 20000 });
}

async function assertRoomSections(page: Page) {
  await expect(page.getByTestId("property-gallery")).toBeVisible();
  await expect(page.getByTestId("room-policies")).toBeVisible();
  await expect(page.getByTestId("proceed-to-booking")).toBeVisible();
}

async function maybeReachBookingEntry(page: Page) {
  const proceedButtons = page.getByTestId("proceed-to-booking");
  const count = await proceedButtons.count();
  if (count === 0) return;
  const first = proceedButtons.first();
  if (!(await first.isEnabled())) return;
  await first.click();
  // Booking/checkout requires auth — either we reach checkout or get
  // redirected to login. Both are valid outcomes for this test.
  await expect(page).toHaveURL(/\/(booking\/checkout|login)/, { timeout: 10000 });
}

test.describe("Room Detail — Arabic (RTL)", () => {
  test.use({ locale: "ar-SA" });

  test("guest sees room details and can reach booking", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("locale", "ar");
    });

    const roomTypeId = await discoverRoomTypeId(page);
    test.skip(!roomTypeId, "No rooms available to test room detail");
    await openRoomDetail(page, roomTypeId as string);

    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await assertRoomSections(page);

    await maybeReachBookingEntry(page);
  });
});

test.describe("Room Detail — English (LTR)", () => {
  test.use({ locale: "en-US" });

  test("guest sees room details and can reach booking", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("locale", "en");
    });

    const roomTypeId = await discoverRoomTypeId(page);
    test.skip(!roomTypeId, "No rooms available to test room detail");
    await openRoomDetail(page, roomTypeId as string);

    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await assertRoomSections(page);

    await maybeReachBookingEntry(page);
  });
});
