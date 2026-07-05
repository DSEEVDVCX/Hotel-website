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

  const startDateParam = req.nextUrl.searchParams.get("startDate");
  const endDateParam = req.nextUrl.searchParams.get("endDate");
  if (!startDateParam || !endDateParam) {
    return NextResponse.json(
      { error: "startDate and endDate are required" },
      { status: 422 }
    );
  }

  const startDate = new Date(startDateParam);
  const endDate = new Date(endDateParam);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 422 });
  }
  if (endDate < startDate) {
    return NextResponse.json(
      { error: "endDate must be on or after startDate" },
      { status: 422 }
    );
  }

  const hotel = await prisma.hotel.findFirst({
    where: { ownerId: userId },
  });
  if (!hotel) {
    return NextResponse.json({ dates: [], rooms: [] });
  }

  const rooms = await prisma.room.findMany({
    where: { hotelId: hotel.id },
    include: {
      roomType: { select: { nameAr: true, nameEn: true } },
      reservations: {
        where: {
          AND: [
            { checkIn: { lt: endDate } },
            { checkOut: { gt: startDate } },
          ],
        },
        include: {
          bookingLineItem: {
            include: {
              booking: {
                include: { guest: { select: { name: true } } },
              },
            },
          },
        },
      },
    },
    orderBy: { roomNumber: "asc" },
  });

  const dates: string[] = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }

  const matrix = rooms.map((room) => {
    const statuses = dates.map((dateStr) => {
      const date = new Date(dateStr);
      if (room.status === "BLOCKED") {
        return { date: dateStr, status: "blocked" as const };
      }
      const reservation = room.reservations.find(
        (r) => r.checkIn <= date && r.checkOut > date
      );
      if (reservation) {
        return {
          date: dateStr,
          status: "booked" as const,
          bookingId: reservation.bookingLineItem.bookingId,
          guestName: reservation.bookingLineItem.booking.guest.name,
        };
      }
      return { date: dateStr, status: "available" as const };
    });

    return {
      roomId: room.id,
      roomNumber: room.roomNumber,
      floor: room.floor,
      roomTypeNameAr: room.roomType.nameAr,
      roomTypeNameEn: room.roomType.nameEn,
      statuses,
    };
  });

  return NextResponse.json({ dates, rooms: matrix });
}
