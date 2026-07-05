import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
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

  const room = await prisma.room.findUnique({
    where: { id },
    include: { hotel: true },
  });
  if (!room || room.hotel.ownerId !== userId) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
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
