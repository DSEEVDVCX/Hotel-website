import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireHotelAdmin } from "@/lib/admin-auth";
import { createMediaAssetSchema, type MediaOwner } from "@/lib/schemas/media";

/**
 * Resolves the owning hotel id for a media owner.
 * - HOTEL:      the owner id IS the hotel id.
 * - ROOM_TYPE:   look up the room type's hotelId.
 * Returns null when the owner entity does not exist.
 */
async function resolveOwnerHotelId(
  ownerType: MediaOwner,
  ownerId: string
): Promise<string | null> {
  if (ownerType === "HOTEL") return ownerId;
  const roomType = await prisma.roomType.findUnique({
    where: { id: ownerId },
    select: { hotelId: true },
  });
  return roomType?.hotelId ?? null;
}

export async function GET(req: NextRequest) {
  const session = await requireHotelAdmin();
  if (session instanceof NextResponse) return session;

  const ownerType = req.nextUrl.searchParams.get("ownerType") as MediaOwner | null;
  const ownerId = req.nextUrl.searchParams.get("ownerId");
  if (!ownerType || !ownerId) {
    return NextResponse.json(
      { error: "ownerType and ownerId are required" },
      { status: 422 }
    );
  }
  if (ownerType !== "HOTEL" && ownerType !== "ROOM_TYPE") {
    return NextResponse.json({ error: "Invalid ownerType" }, { status: 422 });
  }

  const hotelId = await resolveOwnerHotelId(ownerType, ownerId);
  if (!hotelId) {
    return NextResponse.json({ assets: [] });
  }
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    select: { ownerId: true },
  });
  if (!hotel || hotel.ownerId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const assets = await prisma.mediaAsset.findMany({
    where: { ownerType, ownerId },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ assets });
}

export async function POST(req: NextRequest) {
  const session = await requireHotelAdmin();
  if (session instanceof NextResponse) return session;

  const body = await req.json();
  const parsed = createMediaAssetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid media asset" },
      { status: 422 }
    );
  }

  const { ownerType, ownerId, url, captionAr, captionEn, sortOrder } =
    parsed.data;

  // Ownership: admin must own the hotel behind the owner entity.
  const hotelId = await resolveOwnerHotelId(ownerType, ownerId);
  if (!hotelId) {
    return NextResponse.json({ error: "Owner not found" }, { status: 404 });
  }
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    select: { ownerId: true },
  });
  if (!hotel || hotel.ownerId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const asset = await prisma.mediaAsset.create({
    data: {
      ownerType,
      ownerId,
      url,
      captionAr: captionAr ?? null,
      captionEn: captionEn ?? null,
      sortOrder,
      uploadedBy: session.userId,
    },
  });

  return NextResponse.json(asset, { status: 201 });
}
