import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const userRole = (session.user as { role: string }).role;
  if (userRole !== "HOTELIER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { roomTypeId, startDate, endDate, nightlyPrice, label } = body;

  if (!roomTypeId || !startDate || !endDate || nightlyPrice === undefined) {
    return NextResponse.json(
      { error: "roomTypeId, startDate, endDate, and nightlyPrice are required" },
      { status: 422 }
    );
  }

  const roomType = await prisma.roomType.findUnique({
    where: { id: roomTypeId },
    include: { hotel: true },
  });
  if (!roomType || roomType.hotel.hotelierId !== userId) {
    return NextResponse.json({ error: "Room type not found" }, { status: 404 });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end < start) {
    return NextResponse.json(
      { error: "endDate must be on or after startDate" },
      { status: 422 }
    );
  }

  try {
    const rate = await prisma.rate.create({
      data: {
        roomTypeId,
        startDate: start,
        endDate: end,
        nightlyPrice: Number(nightlyPrice),
        label: label ?? null,
      },
    });

    return NextResponse.json(rate, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create rate";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const userRole = (session.user as { role: string }).role;
  if (userRole !== "HOTELIER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const hotel = await prisma.hotel.findFirst({
    where: { hotelierId: userId },
    include: { roomTypes: { select: { id: true } } },
  });
  if (!hotel || hotel.roomTypes.length === 0) {
    return NextResponse.json({ rates: [] });
  }

  const roomTypeIds = hotel.roomTypes.map((rt) => rt.id);

  const rates = await prisma.rate.findMany({
    where: { roomTypeId: { in: roomTypeIds } },
    include: { roomType: { select: { nameAr: true, nameEn: true } } },
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json({ rates });
}
