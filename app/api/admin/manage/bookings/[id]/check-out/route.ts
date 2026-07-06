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

  if (booking.status !== "CHECKED_IN") {
    return NextResponse.json(
      { error: `Booking must be CHECKED_IN to check out (current: ${booking.status})` },
      { status: 409 }
    );
  }

  const totalPrice = booking.totalPrice.toNumber();
  const payoutAmount = Number((totalPrice * 0.9).toFixed(2));

  try {
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.booking.updateMany({
        where: { id, status: "CHECKED_IN" },
        data: { status: "COMPLETED" },
      });
      if (updated.count !== 1) {
        throw new Error("Booking was already checked out or changed status");
      }

      const completed = await tx.booking.findUniqueOrThrow({ where: { id } });

      const payout = await tx.payout.create({
        data: {
          ownerId: booking.hotel.ownerId,
          bookingId: id,
          amount: payoutAmount,
          status: "PENDING",
        },
      });

      return { booking: completed, payout };
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Booking was already checked out or changed status" },
      { status: 409 }
    );
  }
}
