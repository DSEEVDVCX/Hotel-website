import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireHotelAdmin } from "@/lib/admin-auth";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireHotelAdmin();
  if (session instanceof NextResponse) return session;

  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { hotel: true },
  });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.hotel.ownerId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (booking.status !== "CONFIRMED") {
    return NextResponse.json(
      { error: `Booking must be CONFIRMED to check in (current: ${booking.status})` },
      { status: 409 }
    );
  }

  const changed = await prisma.booking.updateMany({
    where: { id, status: "CONFIRMED" },
    data: { status: "CHECKED_IN" },
  });
  if (changed.count !== 1) {
    return NextResponse.json(
      { error: "Booking was already changed by another request" },
      { status: 409 }
    );
  }

  const updated = await prisma.booking.findUniqueOrThrow({ where: { id } });

  return NextResponse.json(updated);
}
