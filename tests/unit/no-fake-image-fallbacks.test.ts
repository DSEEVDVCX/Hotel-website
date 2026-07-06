import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const guestImageFiles = [
  "components/homepage/rooms-grid.tsx",
  "components/homepage/featured-cards.tsx",
  "components/property-detail/available-rooms.tsx",
  "components/search/ResultCard.tsx",
  "app/(guest)/hotels/[hotelId]/page.tsx",
  "app/(guest)/rooms/[roomTypeId]/page.tsx",
  "app/(guest)/booking/checkout/page.tsx",
  "lib/room-types.ts",
];

describe("guest supplied image policy", () => {
  it.each(guestImageFiles)("does not generate fake photos in %s", (filePath) => {
    const source = readFileSync(join(process.cwd(), filePath), "utf8");

    expect(source).not.toContain("picsum.photos");
  });
});
