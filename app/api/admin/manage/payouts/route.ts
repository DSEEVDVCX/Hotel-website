import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireHotelAdmin } from "@/lib/admin-auth";

export async function GET(_req: NextRequest) {
  const session = await requireHotelAdmin();
  if (session instanceof NextResponse) return session;

  const payouts = await prisma.payout.findMany({
    where: { ownerId: session.userId },
    include: {
      booking: {
        select: {
          id: true,
          checkIn: true,
          checkOut: true,
          totalPrice: true,
          hotel: { select: { nameAr: true, nameEn: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ payouts });
}
