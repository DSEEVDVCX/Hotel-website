import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("rooms catalog page", () => {
  it("uses room types instead of public hotel cards", () => {
    const source = readFileSync(join(process.cwd(), "app/(guest)/rooms/page.tsx"), "utf8");

    expect(source).toContain("getAllRoomTypes");
    expect(source).not.toContain("getPublicHotelCards");
  });
});

describe("single-hotel public navigation", () => {
  const guestNavigationFiles = [
    "components/homepage/featured-cards.tsx",
    "components/search/ResultCard.tsx",
    "components/guest-account/favorites-list.tsx",
  ];

  it.each(guestNavigationFiles)("does not link guests to hotel detail pages from %s", (filePath) => {
    const source = readFileSync(join(process.cwd(), filePath), "utf8");

    expect(source).not.toContain("/hotels/${");
    expect(source).not.toContain("`/hotels/");
  });
});
