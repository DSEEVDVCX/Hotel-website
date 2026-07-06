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
  const { status } = body;

  if (status !== "AVAILABLE" && status !== "BLOCKED") {
    return NextResponse.json(
      { error: "status must be AVAILABLE or BLOCKED" },
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

  const updated = await prisma.room.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(updated);
}
