import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requirePlatformAdmin();
  if (session instanceof NextResponse) return session;

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      phoneNumber: true,
      createdAt: true,
      _count: {
        select: { bookings: true, favorites: true, reviews: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const [bookings, favorites] = await Promise.all([
    prisma.booking.findMany({
      where: { guestId: id },
      include: {
        hotel: { select: { nameAr: true, nameEn: true, city: true } },
        payment: { select: { amount: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.favorite.findMany({
      where: { guestId: id },
      include: {
        hotel: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            city: true,
            starRating: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const totalSpent = bookings
    .filter((b) => b.status !== "CANCELLED" && b.status !== "FAILED")
    .reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);

  return NextResponse.json({
    user,
    bookings,
    favorites: favorites.map((f) => f.hotel),
    totalSpent,
  });
}
