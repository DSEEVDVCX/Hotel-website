import { NextRequest, NextResponse } from "next/server";
import { getHotelWithAvailability } from "@/lib/availability";
import { getReviewsByHotel } from "@/lib/firebase";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ hotelId: string }> }
) {
  const { hotelId } = await params;
  const searchParams = req.nextUrl.searchParams;
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");

  const hotel =
    checkIn && checkOut
      ? await getHotelWithAvailability(
          hotelId,
          new Date(checkIn),
          new Date(checkOut)
        )
      : await prisma.hotel.findFirst({
          where: { id: hotelId, status: "ACTIVE" },
          include: {
            roomTypes: {
              include: {
                rooms: { where: { status: "AVAILABLE" } },
                rates: true,
              },
            },
          },
        });

  if (!hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }

  const roomTypeIds = hotel.roomTypes.map((rt) => rt.id);

  const [hotelGallery, roomTypeMedia, recentReviews, reviewStats, ownerData] =
    await Promise.all([
      prisma.mediaAsset.findMany({
        where: { ownerType: "HOTEL", ownerId: hotelId },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.mediaAsset.findMany({
        where: {
          ownerType: "ROOM_TYPE",
          ownerId: { in: roomTypeIds },
        },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.review.findMany({
        where: { hotelId },
        include: { guest: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.review.aggregate({
        where: { hotelId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      prisma.hotel.findUnique({
        where: { id: hotelId },
        select: {
          owner: { select: { name: true, createdAt: true } },
        },
      }),
    ]);

  const roomTypeMediaByOwner = new Map<string, typeof roomTypeMedia>();
  for (const id of roomTypeIds) roomTypeMediaByOwner.set(id, []);
  for (const media of roomTypeMedia) {
    const list = roomTypeMediaByOwner.get(media.ownerId);
    if (list) list.push(media);
  }

  const roomTypes = hotel.roomTypes.map((rt) => ({
    ...rt,
    gallery: roomTypeMediaByOwner.get(rt.id) ?? [],
  }));

  const avgRating = reviewStats._avg.rating;
  const reviewCount = reviewStats._count.rating;
  const host = ownerData?.owner
    ? {
        name: ownerData.owner.name,
        joinedAt: ownerData.owner.createdAt,
      }
    : null;

  // Reviews read-through: prefer Firebase, fall back to the Postgres slice above.
  let reviewsOut: unknown = recentReviews;
  let avgRatingOut = avgRating ?? null;
  let reviewCountOut = reviewCount;
  const fbReviews = await getReviewsByHotel(hotelId);
  if (fbReviews && fbReviews.length > 0) {
    reviewsOut = fbReviews.slice(0, 5).map((r) => ({
      id: r.id,
      rating: r.rating,
      commentAr: r.commentAr ?? null,
      commentEn: r.commentEn ?? null,
      createdAt: r.createdAt,
      guest: { name: r.guestName ?? null },
    }));
    reviewCountOut = fbReviews.length;
    avgRatingOut =
      Math.round(
        (fbReviews.reduce((s, r) => s + r.rating, 0) / fbReviews.length) * 10
      ) / 10;
  }

  return NextResponse.json({
    ...hotel,
    roomTypes,
    gallery: hotelGallery,
    reviews: reviewsOut,
    avgRating: avgRatingOut,
    reviewCount: reviewCountOut,
    host,
  });
}
