import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { writeReview, getReviewsByHotel } from "@/lib/firebase";
import { z } from "zod";

const reviewSchema = z.object({
  hotelId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  commentAr: z.string().optional(),
  commentEn: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const userName = (session.user as { name?: string }).name ?? null;
  const body = await req.json();
  const result = reviewSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 422 });
  }

  const { hotelId, rating, commentAr, commentEn } = result.data;

  // Any logged-in user may review a hotel — no completed booking required.
  const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
  if (!hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }

  // One review per guest per hotel.
  const existingReview = await prisma.review.findUnique({
    where: { guestId_hotelId: { guestId: userId, hotelId } },
  });
  if (existingReview) {
    return NextResponse.json({ error: "Review already exists" }, { status: 409 });
  }

  const review = await prisma.review.create({
    data: {
      guestId: userId,
      hotelId,
      rating,
      commentAr,
      commentEn,
    },
  });

  // Durable copy to Firebase (best-effort; never blocks the primary flow).
  await writeReview({
    id: review.id,
    hotelId: review.hotelId,
    guestId: review.guestId,
    guestName: userName,
    rating: review.rating,
    commentAr: review.commentAr,
    commentEn: review.commentEn,
    createdAt: review.createdAt,
  });

  return NextResponse.json(review, { status: 201 });
}

export async function GET(req: NextRequest) {
  const hotelId = req.nextUrl.searchParams.get("hotelId");
  if (!hotelId) {
    return NextResponse.json({ error: "hotelId required" }, { status: 422 });
  }

  // Authenticated lookup of the current guest's own review for this hotel.
  // Reviews are unique per (guestId, hotelId), so this returns at most one.
  if (req.nextUrl.searchParams.get("mine") === "true") {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as { id: string }).id;
    const mine = await prisma.review.findUnique({
      where: { guestId_hotelId: { guestId: userId, hotelId } },
    });
    return NextResponse.json({
      review: mine
        ? {
            id: mine.id,
            rating: mine.rating,
            commentAr: mine.commentAr,
            commentEn: mine.commentEn,
            createdAt: mine.createdAt,
          }
        : null,
    });
  }

  // Prefer Firebase; fall back to Postgres when disabled/empty.
  const fbReviews = await getReviewsByHotel(hotelId);
  if (fbReviews && fbReviews.length > 0) {
    const averageRating =
      fbReviews.reduce((sum, r) => sum + r.rating, 0) / fbReviews.length;
    return NextResponse.json({
      reviews: fbReviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        commentAr: r.commentAr ?? null,
        commentEn: r.commentEn ?? null,
        guestName: r.guestName ?? null,
        createdAt: r.createdAt,
      })),
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: fbReviews.length,
    });
  }

  const reviews = await prisma.review.findMany({
    where: { hotelId },
    orderBy: { createdAt: "desc" },
    include: {
      guest: { select: { name: true } },
    },
  });

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      commentAr: r.commentAr,
      commentEn: r.commentEn,
      guestName: r.guest.name,
      createdAt: r.createdAt,
    })),
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews: reviews.length,
  });
}
