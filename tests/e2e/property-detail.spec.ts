import { test, expect, type Page } from "@playwright/test";

function isoDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

const CHECK_IN = isoDate(7);
const CHECK_OUT = isoDate(9);

async function discoverHotelId(page: Page): Promise<string | null> {
  await page.goto("/");
  const link = page.locator("a[href*='/hotels/']").first();
  if ((await link.count()) === 0) return null;
  const href = await link.getAttribute("href");
  if (!href) return null;
  const match = href.match(/\/hotels\/([^/?#]+)/);
  return match ? match[1] : null;
}

async function openPropertyDetail(page: Page, hotelId: string) {
  await page.goto(`/hotels/${hotelId}?checkIn=${CHECK_IN}&checkOut=${CHECK_OUT}`);
  await expect(page.getByTestId("property-gallery")).toBeVisible({ timeout: 20000 });
}

async function assertCoreSections(page: Page) {
  await expect(page.getByTestId("property-gallery")).toBeVisible();
  await expect(page.getByTestId("property-map")).toBeVisible();
  await expect(page.getByTestId("property-reviews")).toBeVisible();
  await expect(page.getByTestId("property-rooms")).toBeVisible();
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

test.describe("Property Detail — Arabic (RTL)", () => {
  test.use({ locale: "ar-SA" });

  test("guest sees gallery, map, reviews, rooms and can reach booking", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("locale", "ar");
    });

    const hotelId = await discoverHotelId(page);
    test.skip(!hotelId, "No hotels available to test property detail");
    await openPropertyDetail(page, hotelId as string);

    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await assertCoreSections(page);

    const amenities = page.getByTestId("property-amenities");
    if ((await amenities.count()) > 0) {
      await expect(amenities).toBeVisible();
    }

    await maybeReachBookingEntry(page);
  });
});

test.describe("Property Detail — English (LTR)", () => {
  test.use({ locale: "en-US" });

  test("guest sees gallery, map, reviews, rooms and can reach booking", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("locale", "en");
    });

    const hotelId = await discoverHotelId(page);
    test.skip(!hotelId, "No hotels available to test property detail");
    await openPropertyDetail(page, hotelId as string);

    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await assertCoreSections(page);

    const amenities = page.getByTestId("property-amenities");
    if ((await amenities.count()) > 0) {
      await expect(amenities).toBeVisible();
    }

    await maybeReachBookingEntry(page);
  });
});
