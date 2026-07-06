import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveSession } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getActiveSession();
  if (session instanceof NextResponse) return session;
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      hotel: true,
      lineItems: {
        include: {
          roomType: true,
          reservations: { include: { room: true } },
        },
      },
      payment: true,
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const canRead =
    booking.guestId === session.userId ||
    (session.role === "ADMIN" && (session.isPlatformAdmin || booking.hotel.ownerId === session.userId));

  if (!canRead) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(booking);
}
