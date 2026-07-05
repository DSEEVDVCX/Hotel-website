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
  if (!room || room.hotel.ownerId !== userId) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const updated = await prisma.room.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(updated);
}
