import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function DELETE(
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

  const rate = await prisma.rate.findUnique({
    where: { id },
    include: { roomType: { include: { hotel: true } } },
  });
  if (!rate || rate.roomType.hotel.ownerId !== userId) {
    return NextResponse.json({ error: "Rate not found" }, { status: 404 });
  }

  await prisma.rate.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
