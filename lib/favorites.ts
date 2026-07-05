import { prisma } from "@/lib/db";

export async function addFavorite(guestId: string, hotelId: string) {
  return prisma.favorite.create({ data: { guestId, hotelId } });
}

export async function removeFavorite(guestId: string, hotelId: string) {
  return prisma.favorite.delete({
    where: { guestId_hotelId: { guestId, hotelId } },
  });
}

export async function getFavorites(guestId: string) {
  const favorites = await prisma.favorite.findMany({
    where: { guestId },
    include: {
      hotel: {
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          city: true,
          starRating: true,
          photos: true,
          status: true,
          roomTypes: {
            select: { basePrice: true },
            orderBy: { basePrice: "asc" },
            take: 1,
          },
          reviews: { select: { rating: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return favorites.map((f) => {
    const reviews = f.hotel.reviews;
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;
    return {
      hotelId: f.hotel.id,
      nameAr: f.hotel.nameAr,
      nameEn: f.hotel.nameEn,
      city: f.hotel.city,
      startingPrice: f.hotel.roomTypes[0]?.basePrice?.toNumber() ?? 0,
      starRating: f.hotel.starRating,
      avgRating,
      heroImage: f.hotel.photos[0] ?? null,
    };
  });
}

export async function isFavorited(guestId: string, hotelId: string) {
  const fav = await prisma.favorite.findUnique({
    where: { guestId_hotelId: { guestId, hotelId } },
  });
  return !!fav;
}
