import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireHotelAdmin, validationError } from "@/lib/admin-auth";
import { parsePositiveNumber } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const session = await requireHotelAdmin();
  if (session instanceof NextResponse) return session;

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
  if (!roomType || roomType.hotel.ownerId !== session.userId) {
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

  const overlappingRate = await prisma.rate.findFirst({
    where: {
      roomTypeId,
      startDate: { lte: end },
      endDate: { gte: start },
    },
  });
  if (overlappingRate) {
    return NextResponse.json(
      { error: "Rate range overlaps an existing rate" },
      { status: 409 }
    );
  }

  try {
    const parsedNightlyPrice = parsePositiveNumber(nightlyPrice, "nightlyPrice");
    const rate = await prisma.rate.create({
      data: {
        roomTypeId,
        startDate: start,
        endDate: end,
        nightlyPrice: parsedNightlyPrice,
        label: label ?? null,
      },
    });

    return NextResponse.json(rate, { status: 201 });
  } catch (error) {
    const invalid = validationError(error);
    if (invalid) return invalid;
    const message = error instanceof Error ? error.message : "Failed to create rate";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(_req: NextRequest) {
  const session = await requireHotelAdmin();
  if (session instanceof NextResponse) return session;

  const hotel = await prisma.hotel.findFirst({
    where: { ownerId: session.userId },
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
