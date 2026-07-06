import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireHotelAdmin } from "@/lib/admin-auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireHotelAdmin();
  if (session instanceof NextResponse) return session;

  const { id } = await params;

  const rate = await prisma.rate.findUnique({
    where: { id },
    include: { roomType: { include: { hotel: true } } },
  });
  if (!rate || rate.roomType.hotel.ownerId !== session.userId) {
    return NextResponse.json({ error: "Rate not found" }, { status: 404 });
  }

  await prisma.rate.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
