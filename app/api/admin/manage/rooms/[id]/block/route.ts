import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireHotelAdmin } from "@/lib/admin-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireHotelAdmin();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const body = await req.json();
  const { startDate, endDate, blocked } = body;

  if (typeof blocked !== "boolean") {
    return NextResponse.json(
      { error: "blocked (boolean) is required" },
      { status: 422 }
    );
  }
  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "startDate and endDate are required" },
      { status: 422 }
    );
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
    return NextResponse.json(
      { error: "endDate must be after startDate" },
      { status: 422 }
    );
  }

  const room = await prisma.room.findUnique({
    where: { id },
    include: { hotel: true },
  });
  if (!room || room.hotel.ownerId !== session.userId) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const overlappingReservations = await prisma.roomReservation.count({
    where: {
      roomId: id,
      checkIn: { lt: end },
      checkOut: { gt: start },
      bookingLineItem: { booking: { status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] } } },
    },
  });
  if (blocked && overlappingReservations > 0) {
    return NextResponse.json(
      { error: "Room has bookings in the requested date range" },
      { status: 409 }
    );
  }

  const updated = await prisma.room.update({
    where: { id },
    data: { status: blocked ? "BLOCKED" : "AVAILABLE" },
  });

  return NextResponse.json({
    ...updated,
    blocked,
    startDate,
    endDate,
  });
}
