import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const userRole = (session.user as { role: string }).role;
  if (userRole !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const hotel = await prisma.hotel.findFirst({ where: { ownerId: userId } });
  if (!hotel) {
    return NextResponse.json({ bookings: [] });
  }

  const status = req.nextUrl.searchParams.get("status");

  const bookings = await prisma.booking.findMany({
    where: {
      hotelId: hotel.id,
      ...(status ? { status: status as never } : {}),
    },
    include: {
      guest: {
        select: { id: true, name: true, email: true, phoneNumber: true },
      },
      lineItems: {
        include: {
          roomType: { select: { nameAr: true, nameEn: true } },
          reservations: {
            include: { room: { select: { roomNumber: true, floor: true } } },
          },
        },
      },
      payment: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ bookings });
}
