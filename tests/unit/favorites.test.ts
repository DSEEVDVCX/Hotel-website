import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    favorite: {
      create: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import { addFavorite, removeFavorite, getFavorites, isFavorited } from "@/lib/favorites";

const mockPrisma = prisma as unknown as {
  favorite: {
    create: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
  };
};

describe("Favorites CRUD", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("addFavorite creates a Favorite record", async () => {
    mockPrisma.favorite.create.mockResolvedValue({ id: "fav1", guestId: "g1", hotelId: "h1" });
    const result = await addFavorite("g1", "h1");
    expect(result).toEqual({ id: "fav1", guestId: "g1", hotelId: "h1" });
    expect(mockPrisma.favorite.create).toHaveBeenCalledWith({
      data: { guestId: "g1", hotelId: "h1" },
    });
  });

  it("removeFavorite deletes by composite key", async () => {
    mockPrisma.favorite.delete.mockResolvedValue({ id: "fav1" });
    await removeFavorite("g1", "h1");
    expect(mockPrisma.favorite.delete).toHaveBeenCalledWith({
      where: { guestId_hotelId: { guestId: "g1", hotelId: "h1" } },
    });
  });

  it("getFavorites returns formatted hotel list", async () => {
    mockPrisma.favorite.findMany.mockResolvedValue([
      {
        hotel: {
          id: "h1", nameAr: "فندق", nameEn: "Hotel", city: "Riyadh",
          starRating: 5, photos: ["img.jpg"], status: "ACTIVE",
          roomTypes: [{ basePrice: { toNumber: () => 450 } }],
          reviews: [{ rating: 5 }, { rating: 4 }],
        },
      },
    ]);

    const result = await getFavorites("g1");
    expect(result).toHaveLength(1);
    expect(result[0].hotelId).toBe("h1");
    expect(result[0].startingPrice).toBe(450);
    expect(result[0].avgRating).toBe(4.5);
    expect(result[0].heroImage).toBe("img.jpg");
  });

  it("isFavorited returns true when favorite exists", async () => {
    mockPrisma.favorite.findUnique.mockResolvedValue({ id: "fav1" });
    const result = await isFavorited("g1", "h1");
    expect(result).toBe(true);
  });

  it("isFavorited returns false when no favorite", async () => {
    mockPrisma.favorite.findUnique.mockResolvedValue(null);
    const result = await isFavorited("g1", "h1");
    expect(result).toBe(false);
  });

  it("getFavorites returns empty array for no favorites", async () => {
    mockPrisma.favorite.findMany.mockResolvedValue([]);
    const result = await getFavorites("g1");
    expect(result).toEqual([]);
  });
});
