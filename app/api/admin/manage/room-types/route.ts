import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireHotelAdmin, validationError } from "@/lib/admin-auth";
import { parsePositiveInt, parsePositiveNumber } from "@/lib/validation";
import { syncRoomTypeToFirebase } from "@/lib/room-types";

export async function POST(req: NextRequest) {
  const session = await requireHotelAdmin();
  if (session instanceof NextResponse) return session;

  const body = await req.json();
  const { hotelId, nameAr, nameEn, descriptionAr, descriptionEn, capacity, bedType, basePrice, amenities, photos } = body;

  if (!hotelId || !nameAr || !nameEn || !capacity || !bedType || basePrice === undefined) {
    return NextResponse.json(
      { error: "hotelId, nameAr, nameEn, capacity, bedType, and basePrice are required" },
      { status: 422 }
    );
  }

  const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
  if (!hotel || hotel.ownerId !== session.userId) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }

  try {
    const parsedCapacity = parsePositiveInt(capacity, "capacity");
    const parsedBasePrice = parsePositiveNumber(basePrice, "basePrice");
    const roomType = await prisma.roomType.create({
      data: {
        hotelId,
        nameAr,
        nameEn,
        descriptionAr: descriptionAr || null,
        descriptionEn: descriptionEn || null,
        capacity: parsedCapacity,
        bedType,
        basePrice: parsedBasePrice,
        amenities: Array.isArray(amenities) ? amenities : [],
        photos: Array.isArray(photos) ? photos : [],
      },
    });

    // Durable copy to Firebase (best-effort).
    await syncRoomTypeToFirebase(roomType.id);

    // The homepage (and search) render room types from an ISR-cached page;
    // revalidate so a newly added room appears immediately instead of after
    // the 5-minute revalidate window.
    revalidatePath("/");
    revalidatePath("/rooms");
    revalidatePath("/search");

    return NextResponse.json(roomType, { status: 201 });
  } catch (error) {
    const invalid = validationError(error);
    if (invalid) return invalid;
    const message = error instanceof Error ? error.message : "Failed to create room type";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await requireHotelAdmin();
  if (session instanceof NextResponse) return session;

  const requestedHotelId = req.nextUrl.searchParams.get("hotelId");

  const hotel = requestedHotelId
    ? await prisma.hotel.findFirst({ where: { id: requestedHotelId, ownerId: session.userId } })
    : await prisma.hotel.findFirst({ where: { ownerId: session.userId } });
  if (!hotel) {
    return NextResponse.json({ roomTypes: [] });
  }

  const roomTypes = await prisma.roomType.findMany({
    where: { hotelId: hotel.id },
    include: { _count: { select: { rooms: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ roomTypes });
}
