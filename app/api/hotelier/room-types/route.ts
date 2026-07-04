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
  const { hotelId, nameAr, nameEn, capacity, bedType, basePrice, amenities, photos } = body;

  if (!hotelId || !nameAr || !nameEn || !capacity || !bedType || basePrice === undefined) {
    return NextResponse.json(
      { error: "hotelId, nameAr, nameEn, capacity, bedType, and basePrice are required" },
      { status: 422 }
    );
  }

  const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
  if (!hotel || hotel.hotelierId !== userId) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }

  try {
    const roomType = await prisma.roomType.create({
      data: {
        hotelId,
        nameAr,
        nameEn,
        capacity: Number(capacity),
        bedType,
        basePrice: Number(basePrice),
        amenities: Array.isArray(amenities) ? amenities : [],
        photos: Array.isArray(photos) ? photos : [],
      },
    });

    return NextResponse.json(roomType, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create room type";
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

  const hotel = await prisma.hotel.findFirst({ where: { hotelierId: userId } });
  if (!hotel) {
    return NextResponse.json({ roomTypes: [] });
  }

  const roomTypes = await prisma.roomType.findMany({
    where: { hotelId: hotel.id },
    include: { rooms: true, rates: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ roomTypes });
}
