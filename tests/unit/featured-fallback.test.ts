import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    featuredSelection: {
      findMany: vi.fn(),
    },
    hotel: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import { getFeaturedProperties } from "@/lib/featured";

const mockPrisma = prisma as unknown as {
  featuredSelection: { findMany: ReturnType<typeof vi.fn> };
  hotel: { findMany: ReturnType<typeof vi.fn> };
};

describe("Featured Fallback Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns only curated hotels when enough are featured", async () => {
    mockPrisma.featuredSelection.findMany.mockResolvedValue([
      {
        hotel: {
          id: "h1", nameAr: "فندق 1", nameEn: "Hotel 1", city: "Riyadh",
          starRating: 5, status: "ACTIVE", photos: ["img1.jpg"],
          roomTypes: [{ basePrice: { toNumber: () => 450 } }],
          reviews: [{ rating: 5 }, { rating: 4 }],
        },
      },
      {
        hotel: {
          id: "h2", nameAr: "فندق 2", nameEn: "Hotel 2", city: "Jeddah",
          starRating: 4, status: "ACTIVE", photos: ["img2.jpg"],
          roomTypes: [{ basePrice: { toNumber: () => 300 } }],
          reviews: [{ rating: 4 }],
        },
      },
    ]);
    mockPrisma.hotel.findMany.mockResolvedValue([]);

    const result = await getFeaturedProperties(2);

    expect(result).toHaveLength(2);
    expect(result[0].hotelId).toBe("h1");
    expect(result[0].isCurated).toBe(true);
    expect(result[1].hotelId).toBe("h2");
    expect(result[1].isCurated).toBe(true);
    expect(mockPrisma.hotel.findMany).not.toHaveBeenCalled();
  });

  it("fills remaining slots with highest-rated fallback hotels", async () => {
    mockPrisma.featuredSelection.findMany.mockResolvedValue([
      {
        hotel: {
          id: "h1", nameAr: "فندق 1", nameEn: "Hotel 1", city: "Riyadh",
          starRating: 5, status: "ACTIVE", photos: ["img1.jpg"],
          roomTypes: [{ basePrice: { toNumber: () => 450 } }],
          reviews: [{ rating: 5 }],
        },
      },
    ]);
    mockPrisma.hotel.findMany.mockResolvedValue([
      {
        id: "h2", nameAr: "فندق 2", nameEn: "Hotel 2", city: "Jeddah",
        starRating: 4, photos: ["img2.jpg"],
        roomTypes: [{ basePrice: { toNumber: () => 300 } }],
        reviews: [{ rating: 4 }, { rating: 5 }],
      },
      {
        id: "h3", nameAr: "فندق 3", nameEn: "Hotel 3", city: "Mecca",
        starRating: 3, photos: ["img3.jpg"],
        roomTypes: [{ basePrice: { toNumber: () => 200 } }],
        reviews: [{ rating: 3 }],
      },
    ]);

    const result = await getFeaturedProperties(3);

    expect(result).toHaveLength(3);
    expect(result[0].isCurated).toBe(true);
    expect(result[1].isCurated).toBe(false);
    expect(result[2].isCurated).toBe(false);
    expect(result[1].avgRating).toBe(4.5);
    expect(result[2].avgRating).toBe(3);
  });

  it("returns empty array when no hotels exist", async () => {
    mockPrisma.featuredSelection.findMany.mockResolvedValue([]);
    mockPrisma.hotel.findMany.mockResolvedValue([]);

    const result = await getFeaturedProperties(6);

    expect(result).toHaveLength(0);
  });

  it("computes avgRating from reviews", async () => {
    mockPrisma.featuredSelection.findMany.mockResolvedValue([
      {
        hotel: {
          id: "h1", nameAr: "فندق", nameEn: "Hotel", city: "Riyadh",
          starRating: 5, status: "ACTIVE", photos: [],
          roomTypes: [{ basePrice: { toNumber: () => 500 } }],
          reviews: [{ rating: 5 }, { rating: 3 }, { rating: 4 }],
        },
      },
    ]);
    mockPrisma.hotel.findMany.mockResolvedValue([]);

    const result = await getFeaturedProperties(1);

    expect(result[0].avgRating).toBeCloseTo(4, 1);
    expect(result[0].reviewCount).toBe(3);
  });
});
