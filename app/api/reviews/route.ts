import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

const reviewSchema = z.object({
  bookingId: z.string().cuid(),
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
  const body = await req.json();
  const result = reviewSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 422 });
  }

  const { bookingId, rating, commentAr, commentEn } = result.data;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.guestId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (booking.status !== "COMPLETED") {
    return NextResponse.json({ error: "Can only review completed stays" }, { status: 409 });
  }

  const existingReview = await prisma.review.findUnique({ where: { bookingId } });
  if (existingReview) {
    return NextResponse.json({ error: "Review already exists" }, { status: 409 });
  }

  const review = await prisma.review.create({
    data: {
      bookingId,
      guestId: userId,
      hotelId: booking.hotelId,
      rating,
      commentAr,
      commentEn,
    },
  });

  return NextResponse.json(review, { status: 201 });
}

export async function GET(req: NextRequest) {
  const hotelId = req.nextUrl.searchParams.get("hotelId");
  if (!hotelId) {
    return NextResponse.json({ error: "hotelId required" }, { status: 422 });
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
