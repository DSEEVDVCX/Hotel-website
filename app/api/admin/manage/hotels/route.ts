import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const userRole = (session.user as { role: string }).role;
  if (userRole !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const hotels = await prisma.hotel.findMany({
    where: { ownerId: userId },
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      city: true,
      status: true,
      _count: { select: { rooms: true, bookings: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const result = hotels.map((h) => ({
    id: h.id,
    nameAr: h.nameAr,
    nameEn: h.nameEn,
    city: h.city,
    status: h.status,
    roomCount: h._count.rooms,
    bookingCount: h._count.bookings,
  }));

  return NextResponse.json({ hotels: result });
}
