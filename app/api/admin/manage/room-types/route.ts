import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { syncRoomTypeToFirebase } from "@/lib/room-types";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const userRole = (session.user as { role: string }).role;
  if (userRole !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { hotelId, nameAr, nameEn, descriptionAr, descriptionEn, capacity, bedType, basePrice, amenities, photos } = body;

  if (!hotelId || !nameAr || !nameEn || !capacity || !bedType || basePrice === undefined) {
    return NextResponse.json(
      { error: "hotelId, nameAr, nameEn, capacity, bedType, and basePrice are required" },
      { status: 422 }
    );
  }

  const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
  if (!hotel || hotel.ownerId !== userId) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }

  try {
    const roomType = await prisma.roomType.create({
      data: {
        hotelId,
        nameAr,
        nameEn,
        descriptionAr: descriptionAr || null,
        descriptionEn: descriptionEn || null,
        capacity: Number(capacity),
        bedType,
        basePrice: Number(basePrice),
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
    const message = error instanceof Error ? error.message : "Failed to create room type";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const userRole = (session.user as { role: string }).role;
  if (userRole !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const requestedHotelId = req.nextUrl.searchParams.get("hotelId");

  const hotel = requestedHotelId
    ? await prisma.hotel.findFirst({ where: { id: requestedHotelId, ownerId: userId } })
    : await prisma.hotel.findFirst({ where: { ownerId: userId } });
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
