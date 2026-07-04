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
  if (userRole !== "HOTELIER") {
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
  if (booking.hotel.hotelierId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (booking.status !== "CONFIRMED") {
    return NextResponse.json(
      { error: `Booking must be CONFIRMED to check in (current: ${booking.status})` },
      { status: 409 }
    );
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: "CHECKED_IN" },
  });

  return NextResponse.json(updated);
}
