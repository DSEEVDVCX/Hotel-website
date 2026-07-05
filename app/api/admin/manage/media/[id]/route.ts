import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { updateMediaAssetSchema, type MediaOwner } from "@/lib/schemas/media";

/**
 * Resolves the owning hotel id for a media owner entity.
 * Mirrors the resolver in the collection route so each route stays
 * self-contained.
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

  const existing = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Media asset not found" }, { status: 404 });
  }

  // Ownership: resolve the hotel behind the asset's owner and verify.
  const hotelId = await resolveOwnerHotelId(
    existing.ownerType as MediaOwner,
    existing.ownerId
  );
  if (!hotelId) {
    return NextResponse.json({ error: "Media asset not found" }, { status: 404 });
  }
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    select: { ownerId: true },
  });
  if (!hotel || hotel.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateMediaAssetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid update" },
      { status: 422 }
    );
  }

  const updated = await prisma.mediaAsset.update({
    where: { id },
    data: {
      ...(parsed.data.captionAr !== undefined
        ? { captionAr: parsed.data.captionAr }
        : {}),
      ...(parsed.data.captionEn !== undefined
        ? { captionEn: parsed.data.captionEn }
        : {}),
      ...(parsed.data.sortOrder !== undefined
        ? { sortOrder: parsed.data.sortOrder }
        : {}),
    },
  });

  return NextResponse.json(updated);
}

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

  const existing = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Media asset not found" }, { status: 404 });
  }

  const hotelId = await resolveOwnerHotelId(
    existing.ownerType as MediaOwner,
    existing.ownerId
  );
  if (!hotelId) {
    return NextResponse.json({ error: "Media asset not found" }, { status: 404 });
  }
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    select: { ownerId: true },
  });
  if (!hotel || hotel.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.mediaAsset.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
