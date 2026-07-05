import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { parseEnumParam } from "@/lib/validation";
import { BookingStatus } from "@prisma/client";

const bookingStatuses = Object.values(BookingStatus);

export async function GET(req: NextRequest) {
  const session = await requireRole("ADMIN");
  if (session instanceof NextResponse) return session;

  const hotel = await prisma.hotel.findFirst({ where: { ownerId: session.userId } });
  if (!hotel) {
    return NextResponse.json({ bookings: [] });
  }

  const status = parseEnumParam(req.nextUrl.searchParams.get("status"), bookingStatuses);
  if (status === null) {
    return NextResponse.json({ error: "Invalid booking status" }, { status: 422 });
  }

  const bookings = await prisma.booking.findMany({
    where: {
      hotelId: hotel.id,
      ...(status ? { status } : {}),
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
