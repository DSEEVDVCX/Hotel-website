import { test, expect } from "@playwright/test";

test.describe("About Us page", () => {
  test("renders story, map and contact details in Arabic (RTL)", async ({
    page,
  }) => {
    await page.goto("/about");

    expect(await page.locator("html").getAttribute("dir")).toBe("rtl");

    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toContainText("من نحن");

    await expect(page.getByText("قصتنا")).toBeVisible();

    await expect(page.getByTestId("about-map")).toBeVisible();

    await expect(page.getByText("info@sewaralandalus.sa")).toBeVisible();
    await expect(page.getByText("+966 11 655 5555")).toBeVisible();
    await expect(page.getByText("الرياض", { exact: false })).toBeVisible();

    const directions = page.getByRole("link", { name: "الاتجاهات" });
    await expect(directions).toBeVisible();
    await expect(directions).toHaveAttribute("target", "_blank");
  });

  test("renders story, map and contact details in English (LTR)", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem("locale", "en");
    });
    await page.goto("/about");

    await expect(page.locator("html")).toHaveAttribute("dir", "ltr", { timeout: 10000 });

    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toContainText("About");

    await expect(page.getByText("Our Story")).toBeVisible();

    await expect(page.getByTestId("about-map")).toBeVisible();

    await expect(page.getByText("info@sewaralandalus.sa")).toBeVisible();
    await expect(page.getByText("Riyadh", { exact: false })).toBeVisible();

    const directions = page.getByRole("link", { name: "Directions" });
    await expect(directions).toBeVisible();
    await expect(directions).toHaveAttribute("target", "_blank");
  });
});
