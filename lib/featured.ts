import { prisma } from "@/lib/db";

function isDatabaseConnectionError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P1001"
  );
}

export type FeaturedProperty = {
  hotelId: string;
  roomTypeId: string | null;
  nameAr: string;
  nameEn: string;
  city: string;
  startingPrice: number;
  starRating: number;
  avgRating: number | null;
  reviewCount: number;
  heroImage: string | null;
  isCurated: boolean;
};

export async function getFeaturedProperties(limit = 6): Promise<FeaturedProperty[]> {
  try {
    const featured = await prisma.featuredSelection.findMany({
      orderBy: { sortOrder: "asc" },
      take: limit,
      include: {
        hotel: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            city: true,
            starRating: true,
            status: true,
            photos: true,
            roomTypes: {
              select: { id: true, basePrice: true },
              orderBy: { basePrice: "asc" },
              take: 1,
            },
            reviews: {
              select: { rating: true },
            },
          },
        },
      },
    });

    const curatedHotels: FeaturedProperty[] = featured
      .filter((f) => f.hotel.status === "ACTIVE")
      .map((f) => {
        const reviews = f.hotel.reviews;
        const avgRating = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : null;
        const startingPrice = f.hotel.roomTypes[0]?.basePrice?.toNumber() ?? 0;
        return {
          hotelId: f.hotel.id,
          roomTypeId: f.hotel.roomTypes[0]?.id ?? null,
          nameAr: f.hotel.nameAr,
          nameEn: f.hotel.nameEn,
          city: f.hotel.city,
          startingPrice,
          starRating: f.hotel.starRating,
          avgRating,
          reviewCount: reviews.length,
          heroImage: f.hotel.photos[0] ?? null,
          isCurated: true,
        };
      });

    if (curatedHotels.length >= limit) {
      return curatedHotels.slice(0, limit);
    }

    const remaining = limit - curatedHotels.length;
    const curatedIds = curatedHotels.map((h) => h.hotelId);

    const fallbackHotels = await prisma.hotel.findMany({
      where: {
        status: "ACTIVE",
        id: { notIn: curatedIds },
      },
      orderBy: [
        { reviews: { _count: "desc" } },
        { createdAt: "desc" },
      ],
      take: remaining,
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        city: true,
        starRating: true,
        photos: true,
        roomTypes: {
          select: { id: true, basePrice: true },
          orderBy: { basePrice: "asc" },
          take: 1,
        },
        reviews: {
          select: { rating: true },
        },
      },
    });

    const fallbackProperties: FeaturedProperty[] = fallbackHotels
      .sort((a, b) => {
        const avgA = a.reviews.length > 0 ? a.reviews.reduce((s, r) => s + r.rating, 0) / a.reviews.length : 0;
        const avgB = b.reviews.length > 0 ? b.reviews.reduce((s, r) => s + r.rating, 0) / b.reviews.length : 0;
        return avgB - avgA;
      })
      .map((hotel) => {
        const reviews = hotel.reviews;
        const avgRating = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : null;
        const startingPrice = hotel.roomTypes[0]?.basePrice?.toNumber() ?? 0;
        return {
          hotelId: hotel.id,
          roomTypeId: hotel.roomTypes[0]?.id ?? null,
          nameAr: hotel.nameAr,
          nameEn: hotel.nameEn,
          city: hotel.city,
          startingPrice,
          starRating: hotel.starRating,
          avgRating,
          reviewCount: reviews.length,
          heroImage: hotel.photos[0] ?? null,
          isCurated: false,
        };
      });

    return [...curatedHotels, ...fallbackProperties];
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      console.warn("[homepage] database unavailable, rendering without featured properties");
      return [];
    }
    throw error;
  }
}
