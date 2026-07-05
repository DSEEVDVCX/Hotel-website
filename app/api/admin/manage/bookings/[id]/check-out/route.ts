import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const userRole = (session.user as { role: string }).role;
  if (userRole !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { hotel: true },
  });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.hotel.ownerId !== userId) {
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

  const result = await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id },
      data: { status: "CHECKED_OUT" },
    });

    const completed = await tx.booking.update({
      where: { id },
      data: { status: "COMPLETED" },
    });

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
}
